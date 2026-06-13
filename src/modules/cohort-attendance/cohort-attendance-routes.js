// src/modules/cohort-attendance/cohort-attendance-routes.js
import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import { getAttendanceLogs, getProfessorLogs, markAttendance } from "./cohort-attendance-controller.js";

const router = express.Router();

// GET  /api/v1/attendance/logs/:cohortId   ← attendanceService.getAttendanceLogs(cohortId)
router.get("/attendance/logs/:cohortId", protect, getAttendanceLogs);

// GET  /api/v1/professor/logs              ← attendanceService.getProfessorLogs()
router.get("/professor/logs", protect, authorize("professor", "admin"), getProfessorLogs);

// POST /api/v1/courses/:courseId/attendance ← attendanceService.markAttendance(courseId, data)
router.post("/courses/:courseId/attendance", protect, authorize("professor", "admin"), markAttendance);

export default router;