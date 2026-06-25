// src/modules/registrar/registrar-service.js
import { RegistrarRequest, LorRequest } from "./registrar-model.js";
import { uploadToS3 } from "../../middleware/upload.middleware.js";

// ─── Registrar ─────────────────────────────────────────────────────────────────

export const getOverview = async (userId) => {
  const requests = await RegistrarRequest.findAll({ where: { student_id: userId } });
  const pending = requests.filter(r => r.status === "pending").length;
  const ready   = requests.filter(r => r.status === "ready").length;
  return {
    overview: { total: requests.length, pending, ready },
    documentRequests: requests.map(r => r.toJSON()),  // frontend expects "documentRequests"
    requests: requests.map(r => r.toJSON()),           // backward compat
    adminSubmittedDocs: [],
  };
};

export const getRequests = async (userId) => {
  const requests = await RegistrarRequest.findAll({
    where: { student_id: userId },
    order: [["createdAt", "DESC"]],
  });
  return { requests: requests.map(r => r.toJSON()) };
};

export const createRequest = async (userId, data, file = null) => {
  let supporting_doc_url = null;
  if (file) {
    const { url } = await uploadToS3(file, "registrar/supporting-docs");
    supporting_doc_url = url;
  }

  const request = await RegistrarRequest.create({
    student_id: userId,
    type:       data.type?.toLowerCase() || "other",
    purpose:    data.purpose,
    copies:     data.copies || 1,
    urgency:    data.urgency || null,
    ...(supporting_doc_url && { supporting_doc_url }),
  });
  return { request: request.toJSON() };
};

export const cancelRequest = async (requestId, userId) => {
  const request = await RegistrarRequest.findOne({ where: { id: requestId, student_id: userId } });
  if (!request) { const err = new Error("Request not found"); err.statusCode = 404; throw err; }
  await request.update({ status: "cancelled" });
  return { request: request.toJSON() };
};

// ─── LOR ──────────────────────────────────────────────────────────────────────

export const getLorRequests = async (userId, role = "student") => {
  // Prof gets all LOR requests where they are the assigned professor
  // Student gets only their own requests
  const where = role === "professor" || role === "admin"
    ? { professor_id: userId }
    : { student_id: userId };

  const requests = await LorRequest.findAll({
    where,
    order: [["createdAt", "DESC"]],
  });
  return requests.map(r => r.toJSON());
};

export const createLorRequest = async (userId, data, file = null) => {
  let supporting_doc_url = null;
  if (file) {
    const { url } = await uploadToS3(file, "registrar/lor-supporting");
    supporting_doc_url = url;
  }

  const request = await LorRequest.create({
    student_id:   userId,
    professor_id: data.teacherId || data.professor_id || null,
    purpose:      data.purpose,
    university:   data.university || null,
    deadline:     data.deadline || null,
    ...(supporting_doc_url && { supporting_doc_url }),
  });
  return request.toJSON();
};

export const cancelLorRequest = async (requestId, userId) => {
  const request = await LorRequest.findOne({ where: { id: requestId, student_id: userId } });
  if (!request) { const err = new Error("LOR request not found"); err.statusCode = 404; throw err; }
  await request.destroy();
  return { message: "LOR request cancelled" };
};

// Professor submits the final LoR file
export const submitLor = async (requestId, remarks, file) => {
  const request = await LorRequest.findByPk(requestId);
  if (!request) { const err = new Error("LOR request not found"); err.statusCode = 404; throw err; }

  let lor_file_url = null;
  if (file) {
    const { url } = await uploadToS3(file, "registrar/lor-files");
    lor_file_url = url;
  }

  await request.update({
    status:  "completed",
    remarks: remarks || null,
    ...(lor_file_url && { lor_file_url }),
  });
  return { ...request.toJSON(), lorFileUrl: lor_file_url };
};

export const approveLorRequest = async (requestId, remarks) => {
  const request = await LorRequest.findByPk(requestId);
  if (!request) { const err = new Error("LOR request not found"); err.statusCode = 404; throw err; }
  await request.update({ status: "accepted", remarks: remarks || null });
  return request.toJSON();
};

export const rejectLorRequest = async (requestId, remarks) => {
  const request = await LorRequest.findByPk(requestId);
  if (!request) { const err = new Error("LOR request not found"); err.statusCode = 404; throw err; }
  await request.update({ status: "rejected", remarks: remarks || null });
  return request.toJSON();
};

export const scheduleLorMeeting = async (requestId, userId, meetingTime) => {
  const request = await LorRequest.findOne({ where: { id: requestId, student_id: userId } });
  if (!request) { const err = new Error("LOR request not found"); err.statusCode = 404; throw err; }
  await request.update({ meeting_time: meetingTime });
  return request.toJSON();
};