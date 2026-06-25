import RevaluationRequest from "./revaluation-model.js";
import User from "../auth/auth-model.js";
import { Op } from "sequelize";

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

export const updateResult = async (requestId, revisedMarks) => {
  const req = await RevaluationRequest.findByPk(requestId);
  if (!req) { const err = new Error("Request not found"); err.statusCode = 404; throw err; }
  await req.update({ revised_marks: revisedMarks, status: "resolved" });
  return { request: req };
};

// ─── Student ───────────────────────────────────────────────────────────────────
export const getStudentOverview = async (studentId) => {
  const requests = await RevaluationRequest.findAll({ where: { student_id: studentId } });
  return { overview: { total: requests.length }, requests };
};

export const getStudentRequests = async (studentId) => {
  const requests = await RevaluationRequest.findAll({ where: { student_id: studentId } });
  return { requests };
};

export const getSubjects = async () => {
  return { subjects: [] }; // seed data se populate hoga
};

export const createStudentRequest = async (studentId, data) => {
  const request = await RevaluationRequest.create({ student_id: studentId, ...data });
  return { request };
};

export const cancelStudentRequest = async (requestId, studentId) => {
  const req = await RevaluationRequest.findOne({ where: { id: requestId, student_id: studentId } });
  if (!req) { const err = new Error("Request not found"); err.statusCode = 404; throw err; }
  await req.destroy();
  return { message: "Request cancelled" };
};