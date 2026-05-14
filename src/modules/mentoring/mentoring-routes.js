import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import {
	getMentees,
	updateAttendance,
	completeMeeting,
} from "./mentoring-controller.js";

const router = express.Router();

// All routes below require authentication
router.use(protect);

// Matches: getAssignedMentees()
router.get("/mentor/students", getMentees);

// Matches: updateMeetingAttendance()
router.post("/meetings/attendance/:id", updateAttendance);

// Matches: submitMeetingNotes()
router.post("/meetings/complete/:id", completeMeeting);

export default router;
