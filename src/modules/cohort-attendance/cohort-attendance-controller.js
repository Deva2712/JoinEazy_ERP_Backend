// src/modules/cohort-attendance/cohort-attendance-controller.js

import { asyncHandler } from "../../middleware/error.middleware.js";
import * as service from "./cohort-attendance-service.js";

// GET /attendance/logs/:cohortId
export const getAttendanceLogs = asyncHandler(async (req, res) => {
  const { cohortId } = req.params;
  const result = await service.getAttendanceLogs(cohortId);
  res.status(200).json(result);
});

// GET /professor/logs
export const getProfessorLogs = asyncHandler(async (req, res) => {
  const result = await service.getProfessorLogs(req.user.id);
  res.status(200).json(result);
});

// POST /courses/:courseId/attendance
// Body: { studentIds: [...], date: "2026-06-06", status: "final" }
// Query: ?cohortId=xxx  (required — needed to scope the log)
export const markAttendance = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const cohortId = req.query.cohortId || req.body.cohortId;

  if (!cohortId) {
    return res.status(400).json({ success: false, message: "cohortId is required" });
  }

  const professor = { id: req.user.id, name: req.user.name };

  // allStudents should come from body — frontend sends them or we fetch from cohort members
  const allStudents = req.body.allStudents || [];

  const result = await service.markAttendance(
    courseId,
    req.body,
    professor,
    cohortId,
    allStudents
  );
  res.status(200).json(result);
});