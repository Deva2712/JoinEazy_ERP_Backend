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
  res.status(200).json({ success: true, ...(await service.rejectRequest(req.params.requestId, req.body.remarks)) });
});
export const result = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.updateResult(req.params.requestId, req.body.revised_marks)) });
});

// Student
export const studentOverview = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.getStudentOverview(req.user.id)) });
});
export const studentRequests = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.getStudentRequests(req.user.id)) });
});
export const subjects = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.getSubjects()) });
});
export const createRequest = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, ...(await service.createStudentRequest(req.user.id, req.body)) });
});
export const cancelRequest = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.cancelStudentRequest(req.params.requestId, req.user.id)) });
});