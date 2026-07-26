// src/modules/marks/marks-service.js
import { Op } from "sequelize";
import { MarkColumn, StudentMark } from "./marks-model.js";
import { Cohort, CohortParticipant } from "../cohort/cohort-model.js";

// Percentage → 10-point CGPA (standard: percentage / 9.5)
const toCgpa = (percentage) =>
  percentage === null ? null : Math.round((percentage / 9.5) * 100) / 100;

const isDeclared = (resultDate) => {
  if (!resultDate) return true; // no date set → visible as soon as it's computed
  return new Date(resultDate) <= new Date();
};

// ─── Shared: build the full sheet (columns + all student rows) for a cohort ──
const buildSheet = async (cohort) => {
  const courseId = cohort.id;

  const columns = await MarkColumn.findAll({
    where: { course_id: courseId },
    order: [["position", "ASC"], ["createdAt", "ASC"]],
  });

  const students = await CohortParticipant.findAll({
    where: { cohort_id: courseId },
    order: [["display_name", "ASC"]],
  });

  const nonFinalColumns = columns.filter((c) => !c.is_final);
  const finalColumn     = columns.find((c) => c.is_final) || null;

  const marks = await StudentMark.findAll({
    where: { column_id: nonFinalColumns.map((c) => c.id) },
  });

  const marksMap = {};
  for (const m of marks) {
    if (!marksMap[m.student_id]) marksMap[m.student_id] = {};
    marksMap[m.student_id][m.column_id] = m.marks_obtained;
  }

  const weightedColumns = nonFinalColumns.filter((c) => c.weightage != null && c.max_marks);
  const declared = finalColumn ? isDeclared(finalColumn.result_date) : false;

  const rows = students.map((s) => {
    const studentId    = s.user_id || s.id;
    const studentMarks = marksMap[studentId] || {};

    let finalPercentage = null;
    if (finalColumn && weightedColumns.length) {
      const allEntered = weightedColumns.every((c) => studentMarks[c.id] != null);
      if (allEntered) {
        finalPercentage = weightedColumns.reduce((sum, c) => {
          return sum + (studentMarks[c.id] / c.max_marks) * c.weightage;
        }, 0);
        finalPercentage = Math.round(finalPercentage * 100) / 100;
      }
    }

    // The professor always sees the real computed number (to verify before
    // declaring); only student-facing endpoints mask it using `declared`.
    return {
      studentId,
      name:  s.display_name || s.username || s.email,
      email: s.email,
      marks: Object.fromEntries(nonFinalColumns.map((c) => [c.id, studentMarks[c.id] ?? null])),
      final: finalColumn ? {
        percentage: finalPercentage,
        cgpa:       toCgpa(finalPercentage),
        computed:   finalPercentage !== null,
        declared,
      } : null,
    };
  });

  return {
    course: { id: cohort.id, title: cohort.cohort_name },
    columns: nonFinalColumns.map((c) => ({
      id: c.id, name: c.name, maxMarks: c.max_marks, weightage: c.weightage,
    })),
    finalColumn: finalColumn ? {
      id: finalColumn.id, name: finalColumn.name,
      credits: finalColumn.credits, resultDate: finalColumn.result_date, semester: finalColumn.semester,
    } : null,
    rows,
  };
};

// ════════════════════════════════════════════════════════════════════════════
// PROFESSOR ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

export const getCourses = async (profId) => {
  const cohorts = await Cohort.findAll({
    where: { creator_id: profId, visibility: { [Op.ne]: "Archived" } },
    order: [["created_at", "DESC"]],
  });

  return Promise.all(
    cohorts.map(async (c) => {
      const studentCount = await CohortParticipant.count({ where: { cohort_id: c.id } });
      return { id: c.id, title: c.cohort_name, description: c.cohort_description, studentCount };
    })
  );
};

export const getMarksSheet = async (courseId, profId) => {
  const cohort = await Cohort.findOne({ where: { id: courseId, creator_id: profId } });
  if (!cohort) throw Object.assign(new Error("Course not found"), { statusCode: 404 });
  return buildSheet(cohort);
};

export const addColumn = async (courseId, profId, data) => {
  const cohort = await Cohort.findOne({ where: { id: courseId, creator_id: profId } });
  if (!cohort) throw Object.assign(new Error("Course not found"), { statusCode: 404 });
  if (!data.name) throw Object.assign(new Error("Column name is required"), { statusCode: 400 });

  const count = await MarkColumn.count({ where: { course_id: courseId } });
  const column = await MarkColumn.create({
    course_id: courseId, name: data.name, max_marks: data.maxMarks ?? null, position: count,
  });
  return { id: column.id, name: column.name, maxMarks: column.max_marks };
};

export const deleteColumn = async (columnId, profId) => {
  const column = await MarkColumn.findByPk(columnId);
  if (!column) throw Object.assign(new Error("Column not found"), { statusCode: 404 });
  const cohort = await Cohort.findOne({ where: { id: column.course_id, creator_id: profId } });
  if (!cohort) throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
  await column.destroy();
  return { deleted: true };
};

export const upsertMark = async (profId, data) => {
  const { columnId, studentId, marksObtained } = data;
  const column = await MarkColumn.findByPk(columnId);
  if (!column) throw Object.assign(new Error("Column not found"), { statusCode: 404 });
  const cohort = await Cohort.findOne({ where: { id: column.course_id, creator_id: profId } });
  if (!cohort) throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
  if (column.max_marks != null && marksObtained > column.max_marks) {
    throw Object.assign(new Error(`Marks cannot exceed ${column.max_marks}`), { statusCode: 400 });
  }
  const [mark] = await StudentMark.findOrCreate({
    where: { column_id: columnId, student_id: studentId },
    defaults: { marks_obtained: marksObtained },
  });
  if (mark.marks_obtained !== marksObtained) await mark.update({ marks_obtained: marksObtained });
  return { columnId, studentId, marksObtained: mark.marks_obtained };
};

// ─── POST /marks/courses/:courseId/final ───────────────────────────────────
// body: { weightages: [{ columnId, weightage }], name, credits, resultDate }
export const configureFinal = async (courseId, profId, data) => {
  const cohort = await Cohort.findOne({ where: { id: courseId, creator_id: profId } });
  if (!cohort) throw Object.assign(new Error("Course not found"), { statusCode: 404 });

  const { weightages, credits, resultDate, semester } = data;
  if (!Array.isArray(weightages) || !weightages.length) {
    throw Object.assign(new Error("weightages array is required"), { statusCode: 400 });
  }
  if (!credits || Number(credits) <= 0) {
    throw Object.assign(new Error("Credits are required (e.g. 4) so this course can count toward the overall SGPA"), { statusCode: 400 });
  }
  if (!resultDate) {
    throw Object.assign(new Error("Result date is required"), { statusCode: 400 });
  }
  if (!semester || Number(semester) <= 0) {
    throw Object.assign(new Error("Semester is required (e.g. 1)"), { statusCode: 400 });
  }

  const total = weightages.reduce((sum, w) => sum + Number(w.weightage || 0), 0);
  if (Math.round(total) !== 100) {
    throw Object.assign(new Error(`Weightages must add up to 100 (got ${total})`), { statusCode: 400 });
  }

  const columns = await MarkColumn.findAll({ where: { course_id: courseId } });
  const columnById = Object.fromEntries(columns.map((c) => [c.id, c]));

  for (const w of weightages) {
    const column = columnById[w.columnId];
    if (!column) continue;
    if (Number(w.weightage) > 0 && column.max_marks == null) {
      throw Object.assign(
        new Error(`Column "${column.name}" needs a max marks value before it can be given a weightage`),
        { statusCode: 400 }
      );
    }
  }

  for (const w of weightages) {
    const column = columnById[w.columnId];
    if (!column) continue;
    await column.update({ weightage: w.weightage });
  }

  let finalColumn = columns.find((c) => c.is_final);
  if (!finalColumn) {
    finalColumn = await MarkColumn.create({
      course_id: courseId, name: data.name || "Final", is_final: true,
      position: columns.length, credits, result_date: resultDate, semester,
    });
  } else {
    await finalColumn.update({ credits, result_date: resultDate, semester });
  }

  return { id: finalColumn.id, name: finalColumn.name, credits: finalColumn.credits, resultDate: finalColumn.result_date, semester: finalColumn.semester };
};

// ════════════════════════════════════════════════════════════════════════════
// STUDENT ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

export const getMyCourses = async (studentId) => {
  const memberships = await CohortParticipant.findAll({ where: { user_id: studentId } });
  const cohortIds = memberships.map((m) => m.cohort_id);
  if (!cohortIds.length) return [];

  const cohorts = await Cohort.findAll({
    where: { id: cohortIds, visibility: { [Op.ne]: "Archived" } },
    order: [["created_at", "DESC"]],
  });

  return Promise.all(
    cohorts.map(async (c) => {
      const columnCount = await MarkColumn.count({ where: { course_id: c.id, is_final: false } });
      return { id: c.id, title: c.cohort_name, description: c.cohort_description, columnCount };
    })
  );
};

export const getMyCourseSheet = async (courseId, studentId) => {
  const isMember = await CohortParticipant.findOne({ where: { cohort_id: courseId, user_id: studentId } });
  if (!isMember) throw Object.assign(new Error("You are not enrolled in this course"), { statusCode: 403 });

  const cohort = await Cohort.findByPk(courseId);
  if (!cohort) throw Object.assign(new Error("Course not found"), { statusCode: 404 });

  const fullSheet = await buildSheet(cohort);
  const myRow = fullSheet.rows.find((r) => r.studentId === studentId) || null;

  // Student-facing view: hide the number until the professor's declared date.
  const maskedRow = myRow && myRow.final && !myRow.final.declared
    ? { ...myRow, final: { ...myRow.final, percentage: null, cgpa: null } }
    : myRow;

  return { course: fullSheet.course, columns: fullSheet.columns, finalColumn: fullSheet.finalColumn, row: maskedRow };
};

// ─── GET /marks/my-semester-result ──────────────────────────────────────────
// Only shows the student's CURRENT semester (the highest semester number set
// across their courses so far) — this is what the "Results" tab shows.
// Past semesters live in getMyGradeHistory below.
export const getMySemesterResult = async (studentId) => {
  const all = await computeAllCourseResults(studentId);
  if (!all.length) return { courses: [], overallSgpa: null, declaredCount: 0, totalCount: 0, semester: null };

  const knownSemesters = all.map((c) => c.semester).filter((s) => s != null);
  const currentSemester = knownSemesters.length ? Math.max(...knownSemesters) : null;

  // If semester hasn't been set on any course yet (older data), fall back to showing everything.
  const courseResults = currentSemester == null
    ? all
    : all.filter((c) => c.semester == null || c.semester === currentSemester);

  const declaredCourses = courseResults.filter((c) => c.status === "declared" && c.credits);
  let overallSgpa = null;
  if (declaredCourses.length) {
    const totalCredits = declaredCourses.reduce((sum, c) => sum + c.credits, 0);
    const weightedSum  = declaredCourses.reduce((sum, c) => sum + c.credits * c.cgpa, 0);
    overallSgpa = totalCredits > 0 ? Math.round((weightedSum / totalCredits) * 100) / 100 : null;
  }

  return {
    courses:       courseResults,
    overallSgpa,
    declaredCount: declaredCourses.length,
    totalCount:    courseResults.length,
    semester:      currentSemester,
  };
};

// ─── GET /marks/my-grade-history ────────────────────────────────────────────
// ALL semesters, grouped — this is what the "Grade History" tab shows.
// Only declared courses are included; each semester gets its own
// credit-weighted SGPA plus the list of courses that make it up.
export const getMyGradeHistory = async (studentId) => {
  const all = await computeAllCourseResults(studentId);
  const declared = all.filter((c) => c.status === "declared" && c.credits && c.semester != null);

  const bySemester = {};
  for (const c of declared) {
    if (!bySemester[c.semester]) bySemester[c.semester] = [];
    bySemester[c.semester].push(c);
  }

  const semesters = Object.keys(bySemester)
    .map(Number)
    .sort((a, b) => b - a) // most recent semester first
    .map((sem) => {
      const courses = bySemester[sem];
      const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
      const weightedSum  = courses.reduce((sum, c) => sum + c.credits * c.cgpa, 0);
      const sgpa = totalCredits > 0 ? Math.round((weightedSum / totalCredits) * 100) / 100 : null;
      return { semester: sem, sgpa, totalCredits, courses };
    });

  return { semesters };
};

// ─── Shared: compute every enrolled course's result for a student ──────────
const computeAllCourseResults = async (studentId) => {
  const memberships = await CohortParticipant.findAll({ where: { user_id: studentId } });
  const cohortIds = memberships.map((m) => m.cohort_id);
  if (!cohortIds.length) return [];

  const cohorts = await Cohort.findAll({ where: { id: cohortIds } });

  return Promise.all(
    cohorts.map(async (cohort) => {
      const finalColumn = await MarkColumn.findOne({ where: { course_id: cohort.id, is_final: true } });

      if (!finalColumn) {
        return { courseId: cohort.id, title: cohort.cohort_name, status: "not_configured", credits: null, semester: null, resultDate: null, percentage: null, cgpa: null };
      }

      const sheet = await buildSheet(cohort);
      const myRow = sheet.rows.find((r) => r.studentId === studentId);
      const final = myRow?.final;

      let status = "pending";
      if (final?.declared && final?.computed) status = "declared";
      else if (final?.computed && !final?.declared) status = "awaiting_result_date";

      return {
        courseId:   cohort.id,
        title:      cohort.cohort_name,
        status,
        credits:    finalColumn.credits,
        semester:   finalColumn.semester,
        resultDate: finalColumn.result_date,
        percentage: status === "declared" ? final.percentage : null,
        cgpa:       status === "declared" ? final.cgpa : null,
      };
    })
  );
};