// src/modules/examination/examination-routes.js
import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import * as ctrl from "./examination-controller.js";

const router = express.Router();
router.use(protect);

// ── Student routes ────────────────────────────────────────────────────────────
// GET  /exams/overview              — ExaminationController.jsx calls this
// GET  /exams/revaluation           — my revaluation requests
// POST /exams/revaluation           — submit new revaluation
router.get("/overview",    ctrl.getOverview);
router.get("/revaluation", ctrl.getRevaluations);
router.post("/revaluation", ctrl.submitRevaluation);

// ── Admin routes ──────────────────────────────────────────────────────────────
// POST /exams/admin/schedule         — add single exam
// POST /exams/admin/schedule/bulk    — add many exams at once
// POST /exams/admin/results          — upsert result
// POST /exams/admin/grade-history    — upsert grade history
// PUT  /exams/admin/revaluation/:id  — update revaluation status
router.post("/admin/schedule",              authorize("admin", "professor"), ctrl.createSchedule);
router.post("/admin/schedule/bulk",         authorize("admin", "professor"), ctrl.bulkCreateSchedule);
router.post("/admin/results",               authorize("admin", "professor"), ctrl.upsertResult);
router.post("/admin/grade-history",         authorize("admin", "professor"), ctrl.upsertGradeHistory);
router.put("/admin/revaluation/:requestId", authorize("admin", "professor"), ctrl.updateRevaluationStatus);

export default router;