import * as MentoringService from "./mentoring-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

// Fetches the list of students assigned to the authenticated mentor
export const getMentees = asyncHandler(async (req, res) => {
	const students = await MentoringService.getAssignedStudents(req.user.id);
	res.status(200).json({ success: true, data: students });
});

// Updates attendance status for a specific mentoring session
export const updateAttendance = asyncHandler(
	async(async (req, res) => {
		const { id } = req.params;
		const { hasAttended } = req.body;

		const result = await MentoringService.markAttendance(id, hasAttended);
		res.status(200).json({ success: true, message: "Attendance updated." });
	}),
);

// Submits the final discussion summary and performance metrics
export const completeMeeting = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const notes = req.body;

	const result = await MentoringService.finalizeSession(id, notes);
	res.status(200).json({
		success: true,
		message: "Meeting records saved successfully.",
	});
});
