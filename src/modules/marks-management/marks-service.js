// src/modules/marks/marks-service.js
import { Op } from "sequelize";
import sequelize from "../../database/connection.js";
import { MarkColumn, StudentMark } from "./marks-model.js";
import { Cohort, CohortParticipant } from "../cohort/cohort-model.js";

const fail = (message, statusCode = 400) => {
  throw Object.assign(new Error(message), { statusCode });
};

const toCgpa = (pct) => (pct === null ? null : Math.round((pct / 9.5) * 100) / 100);
const isDeclared = (resultDate) => !resultDate || new Date(resultDate) <= new Date();

// One grouped COUNT query instead of one query per row — used for both
// "students per course" and "columns per course" card counts.
const groupCounts = async (Model, ids, idField, extraWhere = {}) => {
  if (!ids.length) return {};
  const rows = await Model.findAll({
    where: { [idField]: ids, ...extraWhere },
    attributes: [idField, [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
    group: [idField],
    raw: true,
  });
  return Object.fromEntries(rows.map((r) => [r[idField], Number(r.count)]));
};

const ownedCohort = async (courseId, profId) => {
  const cohort = await Cohort.findOne({ where: { id: courseId, creator_id: profId } });
  if (!cohort) fail("Course not found", 404);
  return cohort;
};

const ownedColumn = async (columnId, profId) => {
  const column = await MarkColumn.findByPk(columnId);
  if (!column) fail("Column not found", 404);
  const cohort = await Cohort.findOne({ where: { id: column.course_id, creator_id: profId } });
  if (!cohort) fail("Not authorized", 403);
  return column;
};

const finalPercentageOf = (weightedColumns, marksByColumn) => {
  if (!weightedColumns.length || !weightedColumns.every((c) => marksByColumn[c.id] != null)) return null;
  const raw = weightedColumns.reduce((sum, c) => sum + (marksByColumn[c.id] / c.max_marks) * c.weightage, 0);
  return Math.round(raw * 100) / 100;
};

// ─── Full sheet (columns + rows) for a cohort. `studentId` narrows students/
// marks to one person — used by the single-row student endpoint so we don't
// pull the whole class just to keep one row. ────────────────────────────────
const buildSheet = async (cohort, studentId = null) => {
  const courseId = cohort.id;
  const columns = await MarkColumn.findAll({
    where: { course_id: courseId },
    order: [["position", "ASC"], ["createdAt", "ASC"]],
  });
  const nonFinal = columns.filter((c) => !c.is_final);
  const finalColumn = columns.find((c) => c.is_final) || null;

  const students = await CohortParticipant.findAll({
    where: studentId ? { cohort_id: courseId, user_id: studentId } : { cohort_id: courseId },
    order: [["display_name", "ASC"]],
  });

  const marks = nonFinal.length
    ? await StudentMark.findAll({
        where: { column_id: nonFinal.map((c) => c.id), ...(studentId ? { student_id: studentId } : {}) },
      })
    : [];
  const byStudent = {};
  for (const m of marks) (byStudent[m.student_id] ??= {})[m.column_id] = m.marks_obtained;

  const weighted = nonFinal.filter((c) => c.weightage != null && c.max_marks);
  const declared = finalColumn ? isDeclared(finalColumn.result_date) : false;

  const rows = students.map((s) => {
    const sid = s.user_id || s.id;
    const myMarks = byStudent[sid] || {};
    const pct = finalColumn ? finalPercentageOf(weighted, myMarks) : null;
    return {
      studentId: sid,
      name: s.display_name || s.username || s.email,
      email: s.email,
      marks: Object.fromEntries(nonFinal.map((c) => [c.id, myMarks[c.id] ?? null])),
      final: finalColumn ? { percentage: pct, cgpa: toCgpa(pct), computed: pct !== null, declared } : null,
    };
  });

  return {
    course: { id: cohort.id, title: cohort.cohort_name },
    columns: nonFinal.map((c) => ({ id: c.id, name: c.name, maxMarks: c.max_marks, weightage: c.weightage })),
    finalColumn: finalColumn && {
      id: finalColumn.id, name: finalColumn.name,
      credits: finalColumn.credits, resultDate: finalColumn.result_date, semester: finalColumn.semester,
    },
    rows,
  };
};

// ════════════════════════════ PROFESSOR ═════════════════════════════════════

export const getCourses = async (profId) => {
  const cohorts = await Cohort.findAll({
    where: { creator_id: profId, visibility: { [Op.ne]: "Archived" } },
    order: [["created_at", "DESC"]],
  });
  const counts = await groupCounts(CohortParticipant, cohorts.map((c) => c.id), "cohort_id");
  return cohorts.map((c) => ({
    id: c.id, title: c.cohort_name, description: c.cohort_description, studentCount: counts[c.id] || 0,
  }));
};

export const getMarksSheet = async (courseId, profId) => buildSheet(await ownedCohort(courseId, profId));

export const addColumn = async (courseId, profId, data) => {
  await ownedCohort(courseId, profId);
  if (!data.name) fail("Column name is required");
  const position = await MarkColumn.count({ where: { course_id: courseId } });
  const column = await MarkColumn.create({ course_id: courseId, name: data.name, max_marks: data.maxMarks ?? null, position });
  return { id: column.id, name: column.name, maxMarks: column.max_marks };
};

export const deleteColumn = async (columnId, profId) => {
  const column = await ownedColumn(columnId, profId);
  await column.destroy();
  return { deleted: true };
};

export const upsertMark = async (profId, { columnId, studentId, marksObtained }) => {
  if (typeof marksObtained !== "number" || Number.isNaN(marksObtained) || marksObtained < 0) {
    fail("marksObtained must be a non-negative number");
  }
  const column = await ownedColumn(columnId, profId);
  if (column.max_marks != null && marksObtained > column.max_marks) {
    fail(`Marks cannot exceed ${column.max_marks}`);
  }
  // Atomic upsert on the (column_id, student_id) unique index — one
  // round-trip, no race between concurrent edits.
  await StudentMark.upsert({ column_id: columnId, student_id: studentId, marks_obtained: marksObtained });
  return { columnId, studentId, marksObtained };
};

// body: { weightages: [{ columnId, weightage }], name, credits, resultDate, semester }
export const configureFinal = async (courseId, profId, data) => {
  await ownedCohort(courseId, profId);
  const { weightages, credits, resultDate, semester } = data;

  if (!Array.isArray(weightages) || !weightages.length) fail("weightages array is required");
  if (!credits || Number(credits) <= 0) fail("Credits are required (e.g. 4) so this course can count toward the overall SGPA");
  if (!resultDate) fail("Result date is required");
  if (!semester || Number(semester) <= 0) fail("Semester is required (e.g. 1)");

  const total = weightages.reduce((sum, w) => sum + Number(w.weightage || 0), 0);
  if (Math.round(total) !== 100) fail(`Weightages must add up to 100 (got ${total})`);

  // Everything below lands together or not at all.
  return sequelize.transaction(async (t) => {
    const columns = await MarkColumn.findAll({ where: { course_id: courseId }, transaction: t });
    const columnById = Object.fromEntries(columns.map((c) => [c.id, c]));

    for (const w of weightages) {
      const column = columnById[w.columnId];
      if (column && Number(w.weightage) > 0 && column.max_marks == null) {
        fail(`Column "${column.name}" needs a max marks value before it can be given a weightage`);
      }
    }

    await Promise.all(
      weightages.filter((w) => columnById[w.columnId])
        .map((w) => columnById[w.columnId].update({ weightage: w.weightage }, { transaction: t }))
    );

    let finalColumn = columns.find((c) => c.is_final);
    finalColumn = finalColumn
      ? await finalColumn.update({ credits, result_date: resultDate, semester }, { transaction: t })
      : await MarkColumn.create(
          { course_id: courseId, name: data.name || "Final", is_final: true, position: columns.length, credits, result_date: resultDate, semester },
          { transaction: t }
        );

    return { id: finalColumn.id, name: finalColumn.name, credits: finalColumn.credits, resultDate: finalColumn.result_date, semester: finalColumn.semester };
  });
};

// ════════════════════════════ STUDENT ════════════════════════════════════════

export const getMyCourses = async (studentId) => {
  const memberships = await CohortParticipant.findAll({ where: { user_id: studentId } });
  const cohortIds = memberships.map((m) => m.cohort_id);
  if (!cohortIds.length) return [];

  const cohorts = await Cohort.findAll({ where: { id: cohortIds, visibility: { [Op.ne]: "Archived" } }, order: [["created_at", "DESC"]] });
  const counts = await groupCounts(MarkColumn, cohorts.map((c) => c.id), "course_id", { is_final: false });
  return cohorts.map((c) => ({
    id: c.id, title: c.cohort_name, description: c.cohort_description, columnCount: counts[c.id] || 0,
  }));
};

export const getMyCourseSheet = async (courseId, studentId) => {
  const isMember = await CohortParticipant.findOne({ where: { cohort_id: courseId, user_id: studentId } });
  if (!isMember) fail("You are not enrolled in this course", 403);
  const cohort = await Cohort.findByPk(courseId);
  if (!cohort) fail("Course not found", 404);

  const sheet = await buildSheet(cohort, studentId); // only this student's row is fetched
  const myRow = sheet.rows[0] || null;
  const row = myRow?.final && !myRow.final.declared
    ? { ...myRow, final: { ...myRow.final, percentage: null, cgpa: null } } // hide number until declared
    : myRow;

  return { course: sheet.course, columns: sheet.columns, finalColumn: sheet.finalColumn, row };
};

// Current-semester overview + SGPA (the "Results" tab).
export const getMySemesterResult = async (studentId) => {
  const all = await computeAllCourseResults(studentId);
  if (!all.length) return { courses: [], overallSgpa: null, declaredCount: 0, totalCount: 0, semester: null };

  const semesters = all.map((c) => c.semester).filter((s) => s != null);
  const currentSemester = semesters.length ? Math.max(...semesters) : null;
  const courses = currentSemester == null ? all : all.filter((c) => c.semester == null || c.semester === currentSemester);

  const declared = courses.filter((c) => c.status === "declared" && c.credits);
  const overallSgpa = sgpaOf(declared);

  return { courses, overallSgpa, declaredCount: declared.length, totalCount: courses.length, semester: currentSemester };
};

// All past semesters, grouped, each with its own SGPA (the "Grade History" tab).
export const getMyGradeHistory = async (studentId) => {
  const declared = (await computeAllCourseResults(studentId))
    .filter((c) => c.status === "declared" && c.credits && c.semester != null);

  const bySemester = {};
  for (const c of declared) (bySemester[c.semester] ??= []).push(c);

  const semesters = Object.keys(bySemester)
    .map(Number)
    .sort((a, b) => b - a)
    .map((sem) => {
      const courses = bySemester[sem];
      return { semester: sem, sgpa: sgpaOf(courses), totalCredits: courses.reduce((s, c) => s + c.credits, 0), courses };
    });

  return { semesters };
};

const sgpaOf = (courses) => {
  if (!courses.length) return null;
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  const weightedSum = courses.reduce((sum, c) => sum + c.credits * c.cgpa, 0);
  return totalCredits > 0 ? Math.round((weightedSum / totalCredits) * 100) / 100 : null;
};

// Every enrolled course's result for a student, in 4 fixed queries no matter
// how many courses they're in (replaces looping buildSheet() per course).
const computeAllCourseResults = async (studentId) => {
  const memberships = await CohortParticipant.findAll({ where: { user_id: studentId } });
  const cohortIds = memberships.map((m) => m.cohort_id);
  if (!cohortIds.length) return [];

  const cohorts = await Cohort.findAll({ where: { id: cohortIds } });
  const cohortMap = Object.fromEntries(cohorts.map((c) => [c.id, c]));

  const allColumns = await MarkColumn.findAll({ where: { course_id: cohortIds } });
  const columnsByCourse = {};
  for (const col of allColumns) (columnsByCourse[col.course_id] ??= []).push(col);

  const nonFinalIds = allColumns.filter((c) => !c.is_final).map((c) => c.id);
  const myMarks = nonFinalIds.length
    ? await StudentMark.findAll({ where: { student_id: studentId, column_id: nonFinalIds } })
    : [];
  const marksByColumn = Object.fromEntries(myMarks.map((m) => [m.column_id, m.marks_obtained]));

  return cohortIds.map((id) => {
    const cohort = cohortMap[id];
    if (!cohort) return null; // e.g. archived/deleted since enrollment

    const columns = columnsByCourse[id] || [];
    const finalColumn = columns.find((c) => c.is_final);
    if (!finalColumn) {
      return { courseId: cohort.id, title: cohort.cohort_name, status: "not_configured", credits: null, semester: null, resultDate: null, percentage: null, cgpa: null };
    }

    const weighted = columns.filter((c) => !c.is_final && c.weightage != null && c.max_marks);
    const percentage = finalPercentageOf(weighted, marksByColumn);
    const declared = isDeclared(finalColumn.result_date);
    const computed = percentage !== null;
    const status = declared && computed ? "declared" : computed ? "awaiting_result_date" : "pending";

    return {
      courseId: cohort.id, title: cohort.cohort_name, status,
      credits: finalColumn.credits, semester: finalColumn.semester, resultDate: finalColumn.result_date,
      percentage: status === "declared" ? percentage : null,
      cgpa: status === "declared" ? toCgpa(percentage) : null,
    };
  }).filter(Boolean);
};