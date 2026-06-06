// src/modules/cohort-assignments/cohort-assignments-controller.js

import { asyncHandler } from "../../middleware/error.middleware.js";
import * as service from "./cohort-assignments-service.js";

// ─── GET /cohort/:cohortId/assignments ────────────────────────────────────────
export const getAssignments = asyncHandler(async (req, res) => {
  const { cohortId } = req.params;
  const data = await service.getAssignments(cohortId);
  res.status(200).json({ success: true, data });
});

// ─── POST /cohort/:cohortId/assignments ───────────────────────────────────────
export const createAssignment = asyncHandler(async (req, res) => {
  const { cohortId } = req.params;
  const data = await service.createAssignment(cohortId, req.body, req.user.id);
  res.status(201).json({ success: true, data });
});

// ─── PUT /cohort/:cohortId/assignments/:assignmentId ──────────────────────────
export const updateAssignment = asyncHandler(async (req, res) => {
  const { cohortId, assignmentId } = req.params;
  const data = await service.updateAssignment(cohortId, assignmentId, req.body, req.user.id);
  res.status(200).json({ success: true, data });
});

// ─── DELETE /cohort/:cohortId/assignments/:assignmentId ───────────────────────
export const deleteAssignment = asyncHandler(async (req, res) => {
  const { cohortId, assignmentId } = req.params;
  await service.deleteAssignment(cohortId, assignmentId, req.user.id, req.user.role);
  res.status(200).json({ success: true, message: "Assignment deleted" });
});

// ─── POST /cohort/:cohortId/assignments/:assignmentId/submit ──────────────────
export const submitAssignment = asyncHandler(async (req, res) => {
  const { cohortId, assignmentId } = req.params;
  const student = { id: req.user.id, name: req.user.name };
  const data = await service.submitAssignment(cohortId, assignmentId, student);
  res.status(200).json({ success: true, data });
});

// ─── DELETE /cohort/:cohortId/assignments/:assignmentId/submit ────────────────
export const unsubmitAssignment = asyncHandler(async (req, res) => {
  const { cohortId, assignmentId } = req.params;
  await service.unsubmitAssignment(cohortId, assignmentId, req.user.id);
  res.status(200).json({ success: true, message: "Submission removed" });
});

// ─── GET /cohort/:cohortId/assignments/submissions/status ─────────────────────
export const getSubmissionStatus = asyncHandler(async (req, res) => {
  const { cohortId } = req.params;
  const assignmentIds = req.query.assignmentIds
    ? req.query.assignmentIds.split(",")
    : null;
  const data = await service.getSubmissionStatus(cohortId, req.user.id, assignmentIds);
  res.status(200).json({ success: true, data });
});

// ─── GET /cohort/:cohortId/assignments/:assignmentId/submissions ──────────────
export const getAssignmentSubmissions = asyncHandler(async (req, res) => {
  const { cohortId, assignmentId } = req.params;
  const data = await service.getAssignmentSubmissions(cohortId, assignmentId);
  res.status(200).json({ success: true, data });
});

// ─── POST /cohort/assignments/:assignmentId/grade ─────────────────────────────
export const gradeAssignment = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const { studentId, marksAwarded, comments } = req.body;

  if (!studentId || marksAwarded === undefined) {
    return res.status(400).json({
      success: false,
      message: "studentId and marksAwarded are required",
    });
  }

  const data = await service.gradeAssignment(assignmentId, studentId, marksAwarded, comments);
  res.status(200).json({ success: true, data });
});
