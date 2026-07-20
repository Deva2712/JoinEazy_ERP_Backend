import * as service from "./revaluation-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

// Professor
export const profOverview = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.getProfOverview(req.user.id)) });
});
export const profRequests = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.getProfRequests(req.user.id, req.query.status)) });
});
export const accept = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.acceptRequest(req.params.requestId)) });
});
export const reject = asyncHandler(async (req, res) => {
  // FIX: frontend ProfessorRevaluation.service.js sends body: { reason } but this was
  // reading req.body.remarks — so professor's rejection reason was always undefined/null.
  const remarks = req.body.remarks ?? req.body.reason ?? null;
  res.status(200).json({ success: true, ...(await service.rejectRequest(req.params.requestId, remarks)) });
});
export const result = asyncHandler(async (req, res) => {
  // FIX: previously passed only req.body.revised_marks — now passes full body so
  // revisedGrade and remarks are also picked up by the updated updateResult().
  res.status(200).json({ success: true, ...(await service.updateResult(req.params.requestId, req.body)) });
});

// Student
export const studentOverview = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.getStudentOverview(req.user.id)) });
});
export const studentRequests = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.getStudentRequests(req.user.id)) });
});
export const subjects = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.getSubjects(req.user.id)) });
});
export const createRequest = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, ...(await service.createStudentRequest(req.user.id, req.body)) });
});
export const cancelRequest = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.cancelStudentRequest(req.params.requestId, req.user.id)) });
});