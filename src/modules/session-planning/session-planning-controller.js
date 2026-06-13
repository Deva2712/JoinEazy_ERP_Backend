import * as service from "./session-planning-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const schedules = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.getSchedules(req.user.id)) });
});
export const today = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.getTodaySessions(req.user.id)) });
});
export const reflections = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.getReflections(req.user.id)) });
});
export const documents = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.getDocuments(req.params.courseId)) });
});
export const bulkDocuments = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, ...(await service.bulkCreateDocuments(req.params.courseId, req.user.id, req.body.documents)) });
});