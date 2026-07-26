import * as svc from "./courses-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const overview = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: await svc.getOverview(req.user.id) });
});

export const registerCourse = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await svc.register(req.user.id, req.body.courses || []) });
});

export const cancelRegistration = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: await svc.cancelRegistration(req.params.regId, req.user.id) });
});

export const swap = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: await svc.swapCourse(req.params.regId, req.user.id, req.body.newCourseId) });
});

export const feedback = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await svc.submitFeedback(req.user.id, req.params.cohortId, req.body) });
});

// One-time department/semester/CGPA entry that the allocation algorithm relies on.
export const getRegistrationProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: await svc.getRegistrationProfile(req.user.id) });
});

export const saveRegistrationProfile = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await svc.saveRegistrationProfile(req.user.id, req.body) });
});

// ─── Admin/Registrar ────────────────────────────────────────────────────────
export const listCourses = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: await svc.listAllCourses() });
});

export const createCourse = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await svc.createCourse(req.body) });
});

export const updateCourse = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: await svc.updateCourse(req.params.courseId, req.body) });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: await svc.deleteCourse(req.params.courseId) });
});

export const updateWindow = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: await svc.updateRegistrationWindow(req.body) });
});

export const runAllocation = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: await svc.runAllocation() });
});