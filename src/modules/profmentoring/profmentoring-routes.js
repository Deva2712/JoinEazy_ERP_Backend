// src/modules/profmentoring/profmentoring-routes.js
// Mounted at: /api/v1/profmentoring
import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import * as ctrl from "./profmentoring-controller.js";

const router = express.Router();
router.use(protect);

// GET  /profmentoring/mentees
router.get("/mentees", ctrl.getAssignedMentees);

// PATCH /profmentoring/meetings/:meetingId/attendance
router.patch("/meetings/:meetingId/attendance", ctrl.updateAttendance);

// POST  /profmentoring/meetings/:meetingId/notes
router.post("/meetings/:meetingId/notes", ctrl.submitNotes);

// ── Admin/HOD only: assigning mentors to students ──────────────────────────
// POST /profmentoring/assign          body: { studentId, mentorId }
router.post("/assign", authorize("admin"), ctrl.assignMentor);

// GET  /profmentoring/unassigned-students
router.get("/unassigned-students", authorize("admin"), ctrl.getUnassignedStudents);

export default router;