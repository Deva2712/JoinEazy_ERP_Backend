import * as service from "./attendance-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const attendance = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.getStudentAttendance(req.user.id)) });
});
export const qr = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.getQR(req.user.id)) });
});
export const timetable = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.getTimetable(req.user.id)) });
});
export const tasks = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.getTasks(req.user.id, req.query.date)) });
});
export const createTask = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, ...(await service.createTask(req.user.id, req.body)) });
});
export const toggleTask = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.toggleTask(req.params.taskId, req.user.id)) });
});
export const deleteTask = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.deleteTask(req.params.taskId, req.user.id)) });
});
export const sessions = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await service.getSessions(req.user.id)) });
});