import RevaluationRequest from "./revaluation-model.js";
import User from "../auth/auth-model.js";
import CohortMember from "../cohort-members/cohort-members-model.js";
import { CohortCourse, CourseSubmission } from "../cohort-courses/cohort-courses-model.js";
import { Cohort } from "../cohort/cohort-model.js";
import { Op } from "sequelize";

// ─── Helper: simple percentage → letter grade ──────────────────────────────────
const gradeFromPercentage = (pct) => {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return null;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
};

// ─── Format request with student name ──────────────────────────────────────────
const fmtRequest = (r, studentMap = {}) => {
  const json = r.toJSON ? r.toJSON() : r;
  const student = studentMap[json.student_id];
  return {
    ...json,
    
    studentName:      student?.name     || json.student_name || "Unknown Student",
    studentEmail:     student?.email    || json.student_email || "",
    enrollmentNo:     student?.enrollment_no || json.enrollment_no || "",
    subjectName:      json.subject      || "Unknown Subject",
    subjectCode:      json.subject_code || "",
    examType:         json.exam_type    || "",
    semester:         json.semester     || "",
    originalMarks:    json.current_marks,
    revisedMarks:     json.revised_marks,
    maxMarks:         json.max_marks    || null,
    originalGrade:    json.original_grade || null,
    revisedGrade:     json.revised_grade  || null,
    reason:           json.reason,
    professorRemarks: json.remarks,
    priority:         json.priority     || "Low",
    submittedAt:      json.createdAt    || json.created_at,
    // status normalize karo
    status: (() => {
      const s = json.status || "pending";
      const map = { pending: "Pending", under_review: "UnderReview", accepted: "UnderReview", resolved: "Approved", rejected: "Rejected", approved: "Approved" };
      return map[s] || s;
    })(),
  };
};

// ─── Professor ─────────────────────────────────────────────────────────────────
export const getProfOverview = async (professorId) => {
  const requests = await RevaluationRequest.findAll({ where: { professor_id: professorId } });

  // student names batch fetch
  const studentIds = [...new Set(requests.map(r => r.student_id).filter(Boolean))];
  const students = studentIds.length
    ? await User.findAll({ where: { id: { [Op.in]: studentIds } }, attributes: ["id", "name", "email"] })
    : [];
  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

  const formatted = requests.map(r => fmtRequest(r, studentMap));
  const pending  = formatted.filter(r => r.status === "Pending").length;
  const inReview = formatted.filter(r => r.status === "UnderReview").length;
  const resolved = formatted.filter(r => ["Approved","Rejected"].includes(r.status)).length;

  return {
    overview: { total: formatted.length, pending, under_review: inReview, resolved },
    requests: formatted,
  };
};

export const getProfRequests = async (professorId, status) => {
  const where = { professor_id: professorId };
  if (status) where.status = status;
  const requests = await RevaluationRequest.findAll({ where });
  return { requests };
};

export const acceptRequest = async (requestId) => {
  const req = await RevaluationRequest.findByPk(requestId);
  if (!req) { const err = new Error("Request not found"); err.statusCode = 404; throw err; }
  await req.update({ status: "accepted" });
  return { request: req };
};

export const rejectRequest = async (requestId, remarks) => {
  const req = await RevaluationRequest.findByPk(requestId);
  if (!req) { const err = new Error("Request not found"); err.statusCode = 404; throw err; }
  await req.update({ status: "rejected", remarks });
  return { request: req };
};

export const updateResult = async (requestId, data) => {
  const req = await RevaluationRequest.findByPk(requestId);
  if (!req) { const err = new Error("Request not found"); err.statusCode = 404; throw err; }
  // FIX: frontend (UploadResultModal) sends { revisedMarks, revisedGrade, remarks } but
  // the old signature only accepted revisedMarks — so revisedGrade and professor remarks
  // were silently discarded. History tab showed blank remarks and grade was missing.
  const revisedMarks = data?.revisedMarks ?? data;   // backward-compat with old numeric arg
  await req.update({
    revised_marks: revisedMarks,
    revised_grade: data?.revisedGrade ?? null,
    remarks:       data?.remarks      ?? null,
    status:        "resolved",
  });
  return { request: fmtRequest(req) };
};

// ─── Student ───────────────────────────────────────────────────────────────────
export const getStudentOverview = async (studentId) => {
  const [requests, { subjects: eligibleSubjects }] = await Promise.all([
    RevaluationRequest.findAll({ where: { student_id: studentId } }),
    getSubjects(studentId),
  ]);
  const formatted = requests.map((r) => fmtRequest(r));
  // FIX: frontend (RevaluationController.jsx) reads response.data.stats.totalRequests,
  // stats.pending etc — but this function previously only returned overview.total (singular)
  // with no breakdown, so all three stat cards on the banner were always undefined/0.
  const stats = {
    totalRequests: formatted.length,
    pending:       formatted.filter(r => r.status === "Pending").length,
    underReview:   formatted.filter(r => r.status === "UnderReview").length,
    approved:      formatted.filter(r => r.status === "Approved").length,
    rejected:      formatted.filter(r => r.status === "Rejected").length,
  };
  return {
    overview: { total: formatted.length },
    stats,
    requests: formatted,
    eligibleSubjects,
  };
};

export const getStudentRequests = async (studentId) => {
  const requests = await RevaluationRequest.findAll({ where: { student_id: studentId } });
  return { requests: requests.map((r) => fmtRequest(r)) };
};

// Eligible subjects = graded courses (from cohorts the student is a member of)
// for which the student already has a declared submission result (marks_awarded set).
export const getSubjects = async (studentId) => {
  if (!studentId) return { subjects: [] };

  const memberships = await CohortMember.findAll({
    where: { user_id: studentId },
    attributes: ["cohort_id"],
  });
  const cohortIds = [...new Set(memberships.map((m) => m.cohort_id))];
  if (!cohortIds.length) return { subjects: [] };

  const cohorts = await Cohort.findAll({
    where: { id: { [Op.in]: cohortIds } },
    attributes: ["id", "cohort_name"],
  });
  const cohortNameMap = Object.fromEntries(cohorts.map((c) => [c.id, c.cohort_name]));

  const courses = await CohortCourse.findAll({
    where: { cohort_id: { [Op.in]: cohortIds }, is_graded: true },
    include: [
      {
        model: CourseSubmission,
        as: "submissions",
        where: { submitted_by: studentId, marks_awarded: { [Op.ne]: null } },
        required: true,
      },
    ],
  });

  const subjects = courses.map((c) => {
    const course = c.toJSON();
    const submission = course.submissions[0];
    const maxMarks = course.max_marks ?? 100;
    const originalMarks = submission.marks_awarded;
    const percentage = maxMarks ? (originalMarks / maxMarks) * 100 : null;

    return {
      subjectCode: course.id,
      subjectName: course.title,
      semester: cohortNameMap[course.cohort_id] || "",
      originalMarks,
      maxMarks,
      grade: gradeFromPercentage(percentage),
    };
  });

  return { subjects };
};

export const createStudentRequest = async (studentId, data) => {
  // subjectCode is the CohortCourse id (see getSubjects) — resolve the professor who owns it
  let professorId = null;
  if (data.subjectCode) {
    const course = await CohortCourse.findByPk(data.subjectCode, { attributes: ["created_by"] });
    professorId = course?.created_by || null;
  }

  const request = await RevaluationRequest.create({
    student_id: studentId,
    professor_id: professorId,
    subject: data.subjectName || data.subject || "Unknown Subject",
    subject_code: data.subjectCode || null,
    semester: data.semester || null,
    exam_type: data.examType || data.exam_type || null,
    reason: data.reason || null,
    current_marks: data.originalMarks ?? data.current_marks ?? null,
    max_marks: data.maxMarks ?? data.max_marks ?? null,
    original_grade: data.grade ?? data.originalGrade ?? null,
    priority: data.priority || "Mid",
  });
  return { request: fmtRequest(request) };
};

export const cancelStudentRequest = async (requestId, studentId) => {
  const req = await RevaluationRequest.findOne({ where: { id: requestId, student_id: studentId } });
  if (!req) { const err = new Error("Request not found"); err.statusCode = 404; throw err; }
  await req.destroy();
  return { message: "Request cancelled" };
};