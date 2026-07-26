// src/modules/marks/marks-routes.js
// Mounted at: /api/v1/marks
import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import * as ctrl from "./marks-controller.js";

const router = express.Router();
router.use(protect);

// ── Student ──────────────────────────────────────────────────────────────
// GET /marks/my-courses                      — course cards for the student
router.get("/my-courses", authorize("student"), ctrl.getMyCourses);

// GET /marks/my-courses/:courseId/sheet       — just this student's own row
router.get("/my-courses/:courseId/sheet", authorize("student"), ctrl.getMyCourseSheet);

// GET /marks/my-semester-result                — current semester overview + SGPA
router.get("/my-semester-result", authorize("student"), ctrl.getMySemesterResult);

// GET /marks/my-grade-history                   — all past semesters, grouped
router.get("/my-grade-history", authorize("student"), ctrl.getMyGradeHistory);

// ── Professor ────────────────────────────────────────────────────────────
// GET  /marks/courses                        — course cards for landing page
router.get("/courses", authorize("professor"), ctrl.getCourses);

// GET  /marks/courses/:courseId/sheet         — full grid: students x columns + final
router.get("/courses/:courseId/sheet", authorize("professor"), ctrl.getMarksSheet);

// POST /marks/courses/:courseId/columns       — add a new column { name, maxMarks }
router.post("/courses/:courseId/columns", authorize("professor"), ctrl.addColumn);

// DELETE /marks/columns/:columnId
router.delete("/columns/:columnId", authorize("professor"), ctrl.deleteColumn);

// PUT  /marks/marks                           — upsert one cell { columnId, studentId, marksObtained }
router.put("/marks", authorize("professor"), ctrl.upsertMark);

// POST /marks/courses/:courseId/final         — configure Final column { weightages: [{columnId, weightage}] }
router.post("/courses/:courseId/final", authorize("professor"), ctrl.configureFinal);

export default router;