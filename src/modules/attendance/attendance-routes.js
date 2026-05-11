import express from "express";
import * as ctrl from "./attendance-controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

// All routes below require authentication
router.use(protect);

// Matches: getAttendanceLogs(cohortId)
router.get("/logs/:cohortId", ctrl.getCohortLogs);

// Matches: markAttendance(courseId, data)
router.post("/courses/:courseId/attendance", ctrl.markAttendance);

// Matches: reopenAttendance(courseId, data)
router.post("/courses/:courseId/attendance/reopen", ctrl.reopen);

// Matches: getProfessorLogs()
router.get("/professor/logs", ctrl.getProfLogs);

// Matches: recordAcademicExperience(data)
router.post("/professor/experience", ctrl.postExperience);

export default router;
