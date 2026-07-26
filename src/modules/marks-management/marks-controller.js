// src/modules/marks/marks-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./marks-service.js";

export const getCourses = asyncHandler(async (req, res) => {
  const data = await svc.getCourses(req.user.id);
  res.json({ success: true, data });
});

export const getMarksSheet = asyncHandler(async (req, res) => {
  const data = await svc.getMarksSheet(req.params.courseId, req.user.id);
  res.json({ success: true, data });
});

export const addColumn = asyncHandler(async (req, res) => {
  const data = await svc.addColumn(req.params.courseId, req.user.id, req.body);
  res.json({ success: true, data });
});

export const deleteColumn = asyncHandler(async (req, res) => {
  const data = await svc.deleteColumn(req.params.columnId, req.user.id);
  res.json({ success: true, data });
});

export const upsertMark = asyncHandler(async (req, res) => {
  const data = await svc.upsertMark(req.user.id, req.body);
  res.json({ success: true, data });
});

export const configureFinal = asyncHandler(async (req, res) => {
  const data = await svc.configureFinal(req.params.courseId, req.user.id, req.body);
  res.json({ success: true, data });
});

// ── Student ──────────────────────────────────────────────────────────────
export const getMyCourses = asyncHandler(async (req, res) => {
  const data = await svc.getMyCourses(req.user.id);
  res.json({ success: true, data });
});

export const getMyCourseSheet = asyncHandler(async (req, res) => {
  const data = await svc.getMyCourseSheet(req.params.courseId, req.user.id);
  res.json({ success: true, data });
});

export const getMySemesterResult = asyncHandler(async (req, res) => {
  const data = await svc.getMySemesterResult(req.user.id);
  res.json({ success: true, data });
});

export const getMyGradeHistory = asyncHandler(async (req, res) => {
  const data = await svc.getMyGradeHistory(req.user.id);
  res.json({ success: true, data });
});