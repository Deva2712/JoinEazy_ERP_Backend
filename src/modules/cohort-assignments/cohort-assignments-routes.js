// src/modules/cohort-assignments/cohort-assignments-routes.js

import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import * as controller from "./cohort-assignments-controller.js";

const router = express.Router({ mergeParams: true });
// mergeParams: true needed — mounted with :cohortId param in app.js
// app.use("/api/v1/cohort/:cohortId/assignments", assignmentRoutes)

router.use(protect);

// ── Submission status must come BEFORE /:assignmentId to avoid route conflict ─
// GET /api/v1/cohort/:cohortId/assignments/submissions/status
router.get("/submissions/status", controller.getSubmissionStatus);

// ── Assignments CRUD ──────────────────────────────────────────────────────────
// GET  /api/v1/cohort/:cohortId/assignments
router.get("/", controller.getAssignments);

// POST /api/v1/cohort/:cohortId/assignments  (professor only)
router.post("/", authorize("professor", "admin", "staff"), controller.createAssignment);

// PUT  /api/v1/cohort/:cohortId/assignments/:assignmentId  (professor only)
router.put("/:assignmentId", authorize("professor", "admin", "staff"), controller.updateAssignment);

// DELETE /api/v1/cohort/:cohortId/assignments/:assignmentId  (professor only)
router.delete("/:assignmentId", authorize("professor", "admin", "staff"), controller.deleteAssignment);

// ── Submissions ───────────────────────────────────────────────────────────────
// POST   /api/v1/cohort/:cohortId/assignments/:assignmentId/submit  (student submits)
router.post("/:assignmentId/submit", controller.submitAssignment);

// DELETE /api/v1/cohort/:cohortId/assignments/:assignmentId/submit  (student unsubmits)
router.delete("/:assignmentId/submit", controller.unsubmitAssignment);

// GET    /api/v1/cohort/:cohortId/assignments/:assignmentId/submissions  (professor views all)
router.get(
  "/:assignmentId/submissions",
  authorize("professor", "admin", "staff"),
  controller.getAssignmentSubmissions
);

export default router;
