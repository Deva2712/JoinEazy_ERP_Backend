import { MentoringMeeting, MenteeProfile } from "./mentoring-model.js";
import User from "../auth/auth-model.js";

/**
 * Logic for managing faculty-student mentoring data via database models.
 */

export const getAssignedStudents = async (mentorId) => {
	// Fetches profiles and includes core user data (name, email) for the UI
	return await MenteeProfile.findAll({
		where: { mentorId },
		include: [
			{ model: User, as: "user" },
			{
				model: MentoringMeeting,
				as: "meetings",
				limit: 5,
				order: [["date", "DESC"]],
			},
		],
	});
};

export const markAttendance = async (meetingId, hasAttended) => {
	const meeting = await MentoringMeeting.findByPk(meetingId);

	if (!meeting) {
		throw new Error("Meeting not found");
	}

	// Update attendance status
	meeting.hasAttended = hasAttended;
	await meeting.save();

	return meeting;
};

export const finalizeSession = async (meetingId, feedbackData) => {
	const { summary, actionPlan, performanceRatings, overallRemarks } =
		feedbackData;

	const meeting = await MentoringMeeting.findByPk(meetingId);

	if (!meeting) {
		throw new Error("Meeting record not found");
	}

	// Prevent documentation if the student was marked absent.
	if (meeting.hasAttended === false) {
		throw new Error("Cannot submit notes: Student was marked as absent.");
	}

	// Update the existing record with session notes and ratings
	return await meeting.update({
		status: "Completed",
		discussionSummary: summary,
		actionPlan: actionPlan,
		performanceRatings: performanceRatings,
		overallRemarks: overallRemarks,
	});
};
