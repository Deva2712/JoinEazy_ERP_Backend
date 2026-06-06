// src/modules/cohort-attendance/cohort-attendance-routes.js

import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import {
  getAttendanceLogs,
  getProfessorLogs,
  markAttendance,
} from "./cohort-attendance-controller.js";

const router = express.Router();

// GET /attendance/logs/:cohortId
router.get(
  "/logs/:cohortId",
  protect,
  getAttendanceLogs
);

// GET /professor/logs
router.get(
  "/professor/logs",
  protect,
  authorize("professor", "admin"),
  getProfessorLogs
);

// POST /courses/:courseId/attendance
router.post(
  "/courses/:courseId/attendance",
  protect,
  authorize("professor", "admin"),
  markAttendance
);

export default router;