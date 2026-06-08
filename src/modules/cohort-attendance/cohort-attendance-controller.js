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
export const markAttendance = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  // cohortId = from query param OR body OR fallback to courseId itself
 
  const cohortId = req.query.cohortId || req.body.cohortId || courseId;

  const professor = { id: req.user.id, name: req.user.name };

  const result = await service.markAttendance(courseId, req.body, professor, cohortId);
  res.status(200).json(result);
});