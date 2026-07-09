// src/modules/examination/examination-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./examination-service.js";

const ok  = (res, data, status = 200) => res.status(status).json({ success: true,  data });
const err = (res, msg, status = 400) => res.status(status).json({ success: false, message: msg });

// ── Student ───────────────────────────────────────────────────────────────────

// GET /exams/overview — single round-trip for ExaminationController.jsx
export const getOverview = asyncHandler(async (req, res) => {
  ok(res, await svc.getOverview(req.user.id));
});

// POST /exams/revaluation — submit revaluation request
export const submitRevaluation = asyncHandler(async (req, res) => {
  if (!req.body.reason?.trim()) return err(res, "Reason is required");
  if (!req.body.subject && !req.body.subjectName) return err(res, "Subject is required");
  ok(res, await svc.submitRevaluation(req.user.id, req.body), 201);
});

// GET /exams/revaluation — get my revaluation requests
export const getRevaluations = asyncHandler(async (req, res) => {
  ok(res, await svc.getRevaluationRequests(req.user.id));
});

// ── Admin ─────────────────────────────────────────────────────────────────────

// POST /exams/admin/schedule — create single exam schedule entry
export const createSchedule = asyncHandler(async (req, res) => {
  ok(res, await svc.createExamSchedule(req.body), 201);
});

// POST /exams/admin/schedule/bulk — bulk create exam schedules
export const bulkCreateSchedule = asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body)) return err(res, "Array of entries required");
  ok(res, await svc.bulkCreateExamSchedule(req.body), 201);
});

// POST /exams/admin/results — upsert result for a student
export const upsertResult = asyncHandler(async (req, res) => {
  ok(res, await svc.upsertResult(req.body), 201);
});

// POST /exams/admin/grade-history — upsert semester grade history
export const upsertGradeHistory = asyncHandler(async (req, res) => {
  ok(res, await svc.upsertGradeHistory(req.body), 201);
});

// PUT /exams/admin/revaluation/:requestId — update revaluation status
export const updateRevaluationStatus = asyncHandler(async (req, res) => {
  const { status, adminRemarks } = req.body;
  const allowed = ["Pending", "UnderReview", "Approved", "Rejected"];
  if (!allowed.includes(status)) return err(res, `status must be one of: ${allowed.join(", ")}`);
  ok(res, await svc.updateRevaluationStatus(req.params.requestId, status, adminRemarks));
});