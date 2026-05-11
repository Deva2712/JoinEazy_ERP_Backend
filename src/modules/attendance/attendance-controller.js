import * as service from "./attendance-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

// Fetch historical attendance logs for a specific cohort.
export const getCohortLogs = asyncHandler(async (req, res) => {
	const logs = await service.getCohortAttendance(req.params.cohortId);
	res.status(200).json({ success: true, data: logs });
});

// Record or update a student attendance session.
export const markAttendance = asyncHandler(async (req, res) => {
	const result = await service.saveAttendance(
		req.params.courseId,
		req.user.id,
		req.body,
	);
	res.status(200).json({
		success: true,
		message: result.isFinal ? "Attendance finalized" : "Draft saved",
		data: result,
	});
});

// Unlock a finalized attendance record for editing.
export const reopenRecord = asyncHandler(async (req, res) => {
	const result = await service.reopenSession(req.params.courseId, req.body);
	res.status(200).json({
		success: true,
		message: "Window re-opened",
		data: result,
	});
});

// Retrieve the authenticated professor's work and activity logs.
export const getProfLogs = asyncHandler(async (req, res) => {
	const logs = await service.getProfessorHistory(req.user.id);
	res.status(200).json({ success: true, data: logs });
});

// Log academic achievements or conference experience.
export const postExperience = asyncHandler(async (req, res) => {
	const result = await service.recordExperience(req.user.id, req.body);
	res.status(201).json({ success: true, data: result });
});
