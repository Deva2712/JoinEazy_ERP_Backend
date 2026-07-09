// src/modules/examination/examination-service.js
import { ExamSchedule, ExamResult, GradeHistory, RevaluationRequest } from "./examination-model.js";

// ── Formatters ────────────────────────────────────────────────────────────────
const fmtSchedule = (e) => {
  const j = e.toJSON ? e.toJSON() : e;
  return {
    id:         j.id,
    subject:    j.subject,
    code:       j.code    || "",
    type:       j.type,
    date:       j.date,
    time:       j.time    || "",
    hall:       j.hall    || "",
    room:       j.room    || "",
    seatNumber: j.seat_number || "",
    semester:   j.semester || "",
  };
};

const fmtResult = (r) => {
  const j = r.toJSON ? r.toJSON() : r;
  return {
    id:       j.id,
    subject:  j.subject,
    code:     j.code     || "",
    semester: j.semester,
    midterm1: j.midterm1 ?? null,
    midterm2: j.midterm2 ?? null,
    endTerm:  j.end_term ?? null,
    marks:    j.marks    ?? null,
    maxMarks: j.max_marks,
    grade:    j.grade    || "",
    status:   j.status,
  };
};

const fmtGradeHistory = (g) => {
  const j = g.toJSON ? g.toJSON() : g;
  return {
    id:           j.id,
    semester:     j.semester,
    sgpa:         j.sgpa         ?? null,
    cgpa:         j.cgpa         ?? null,
    totalCredits: j.total_credits ?? null,
    subjects:     j.subjects     || [],
  };
};

const fmtReval = (r) => {
  const j = r.toJSON ? r.toJSON() : r;
  return {
    id:           j.id,
    resultId:     j.result_id    || null,
    subject:      j.subject,
    subjectCode:  j.subject_code || "",
    subjectName:  j.subject,
    semester:     j.semester     || "",
    reason:       j.reason,
    priority:     j.priority,
    status:       j.status,
    adminRemarks: j.admin_remarks || null,
    createdAt:    j.created_at   || j.createdAt,
  };
};

// ── Overview (single round-trip) ──────────────────────────────────────────────
export const getOverview = async (studentId) => {
  const sid = String(studentId);
  const [schedules, results, gradeHistory, revaluationRequests] = await Promise.all([
    ExamSchedule.findAll({
      where: { student_id: sid },
      order: [["date", "ASC"]],
    }),
    ExamResult.findAll({
      where: { student_id: sid },
      order: [["semester", "ASC"], ["subject", "ASC"]],
    }),
    GradeHistory.findAll({
      where: { student_id: sid },
      order: [["semester", "ASC"]],
    }),
    RevaluationRequest.findAll({
      where: { student_id: sid },
      order: [["created_at", "DESC"]],
    }),
  ]);

  return {
    examSchedule:        schedules.map(fmtSchedule),
    results:             results.map(fmtResult),
    gradeHistory:        gradeHistory.map(fmtGradeHistory),
    revaluationRequests: revaluationRequests.map(fmtReval),
  };
};

// ── Exam Schedule CRUD (admin) ────────────────────────────────────────────────
export const createExamSchedule = async (data) => {
  const exam = await ExamSchedule.create({
    student_id:  String(data.studentId || data.student_id),
    subject:     data.subject,
    code:        data.code        || null,
    type:        data.type,
    date:        data.date,
    time:        data.time        || null,
    hall:        data.hall        || null,
    room:        data.room        || null,
    seat_number: data.seatNumber  || data.seat_number || null,
    semester:    data.semester    || null,
  });
  return fmtSchedule(exam);
};

export const bulkCreateExamSchedule = async (entries) => {
  const rows = entries.map((d) => ({
    student_id:  String(d.studentId || d.student_id),
    subject:     d.subject,
    code:        d.code        || null,
    type:        d.type,
    date:        d.date,
    time:        d.time        || null,
    hall:        d.hall        || null,
    room:        d.room        || null,
    seat_number: d.seatNumber  || d.seat_number || null,
    semester:    d.semester    || null,
  }));
  const created = await ExamSchedule.bulkCreate(rows, { returning: true });
  return created.map(fmtSchedule);
};

// ── Results CRUD (admin) ──────────────────────────────────────────────────────
export const upsertResult = async (data) => {
  const [record] = await ExamResult.findOrCreate({
    where: {
      student_id: String(data.studentId || data.student_id),
      subject:    data.subject,
      semester:   data.semester,
    },
    defaults: {
      code:      data.code     || null,
      midterm1:  data.midterm1 ?? null,
      midterm2:  data.midterm2 ?? null,
      end_term:  data.endTerm  ?? data.end_term ?? null,
      marks:     data.marks    ?? null,
      max_marks: data.maxMarks || data.max_marks || 100,
      grade:     data.grade    || null,
      status:    data.status   || "Pending",
    },
  });

  await record.update({
    code:      data.code     ?? record.code,
    midterm1:  data.midterm1 ?? record.midterm1,
    midterm2:  data.midterm2 ?? record.midterm2,
    end_term:  data.endTerm  ?? data.end_term ?? record.end_term,
    marks:     data.marks    ?? record.marks,
    max_marks: data.maxMarks ?? record.max_marks,
    grade:     data.grade    ?? record.grade,
    status:    data.status   ?? record.status,
  });

  return fmtResult(record);
};

// ── Grade History CRUD (admin) ────────────────────────────────────────────────
export const upsertGradeHistory = async (data) => {
  const [record] = await GradeHistory.findOrCreate({
    where: {
      student_id: String(data.studentId || data.student_id),
      semester:   data.semester,
    },
    defaults: {
      sgpa:          data.sgpa          ?? null,
      cgpa:          data.cgpa          ?? null,
      total_credits: data.totalCredits  ?? data.total_credits ?? null,
      subjects:      data.subjects      || [],
    },
  });

  await record.update({
    sgpa:          data.sgpa          ?? record.sgpa,
    cgpa:          data.cgpa          ?? record.cgpa,
    total_credits: data.totalCredits  ?? record.total_credits,
    subjects:      data.subjects      ?? record.subjects,
  });

  return fmtGradeHistory(record);
};

// ── Revaluation ───────────────────────────────────────────────────────────────
export const submitRevaluation = async (studentId, data) => {
  // Duplicate check — same subject + semester
  const existing = await RevaluationRequest.findOne({
    where: {
      student_id: String(studentId),
      subject:    data.subject || data.subjectName,
      semester:   data.semester || null,
      status:     ["Pending", "UnderReview"],
    },
  });
  if (existing) {
    const e = new Error("Revaluation already submitted for this subject");
    e.statusCode = 409;
    throw e;
  }

  const reval = await RevaluationRequest.create({
    student_id:   String(studentId),
    result_id:    data.id        || data.resultId    || null,
    subject:      data.subject   || data.subjectName || "",
    subject_code: data.code      || data.subjectCode || null,
    semester:     data.semester  || null,
    reason:       data.reason,
    priority:     data.priority  || "Mid",
    status:       "Pending",
  });

  return fmtReval(reval);
};

export const getRevaluationRequests = async (studentId) => {
  const rows = await RevaluationRequest.findAll({
    where: { student_id: String(studentId) },
    order: [["created_at", "DESC"]],
  });
  return rows.map(fmtReval);
};

// Admin: update revaluation status
export const updateRevaluationStatus = async (requestId, status, adminRemarks) => {
  const req = await RevaluationRequest.findByPk(requestId);
  if (!req) { const e = new Error("Request not found"); e.statusCode = 404; throw e; }
  await req.update({ status, admin_remarks: adminRemarks || req.admin_remarks });
  return fmtReval(req);
};