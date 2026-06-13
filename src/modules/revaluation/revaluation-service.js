import RevaluationRequest from "./revaluation-model.js";

// ─── Professor ─────────────────────────────────────────────────────────────────
export const getProfOverview = async (professorId) => {
  const requests = await RevaluationRequest.findAll({ where: { professor_id: professorId } });
  const pending = requests.filter(r => r.status === "pending").length;
  const resolved = requests.filter(r => r.status === "resolved").length;
  return { overview: { total: requests.length, pending, resolved }, requests };
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