import {
	OfficeHour,
	ScheduledEvent,
	MeetingRequest,
} from "./schedule-model.js";

// Aggregates timetable, office hours, and pending requests for the UI overview.
export const getProfessorSchedule = async (userId) => {
	const officeHours = await OfficeHour.findAll({ where: { userId } });
	const meetings = await ScheduledEvent.findAll({
		where: { hostId: userId },
		order: [["startTime", "ASC"]],
	});

	const incomingRequests = await MeetingRequest.findAll({
		where: { receiverId: userId, status: "pending" },
	});

	const outgoingRequests = await MeetingRequest.findAll({
		where: { senderId: userId },
	});

	return {
		officeHours,
		scheduledMeetings: meetings,
		meetingRequests: incomingRequests,
		outgoingRequests,
	};
};

// Updates the master availability/office hours for the professor.
export const updateOfficeHours = async (userId, slots) => {
	await OfficeHour.destroy({ where: { userId } });
	return await OfficeHour.bulkCreate(
		slots.map((slot) => ({ ...slot, userId })),
	);
};

// Manually creates an event on the professor's calendar.
export const createCalendarEvent = async (userId, eventData) => {
	return await ScheduledEvent.create({
		...eventData,
		hostId: userId,
		status: "scheduled",
	});
};

// Directly schedules a meeting (bypasses request flow).
export const scheduleDirectMeeting = async (userId, meetingData) => {
	return await ScheduledEvent.create({
		hostId: userId,
		participantName: meetingData.participantName,
		participantId: meetingData.participantId,
		participantRole: meetingData.participantRole || "Student",
		type: meetingData.type || "Offline",
		category: meetingData.category || "Academic",
		startTime: meetingData.startTime,
		subject: meetingData.subject,
		location: meetingData.location || "TBD",
		meetingLink: meetingData.meetingLink || null,
		status: "scheduled",
	});
};

// Sends a new meeting request to another user.
export const createOutgoingRequest = async (userId, requestData) => {
	return await MeetingRequest.create({
		senderId: userId,
		receiverId: requestData.receiverId,
		requestedTime: requestData.requestedTime,
		reason: requestData.reason,
		status: "pending",
	});
};

// Handles meeting actions: accept, reject, or suggest alternative times.
export const processMeetingAction = async (requestId, action, payload) => {
	const request = await MeetingRequest.findByPk(requestId);
	if (!request) {
		const err = new Error("Meeting record not found");
		err.statusCode = 404;
		throw err;
	}

	if (action === "accept") {
		request.status = "accepted";

		await ScheduledEvent.create({
			hostId: request.receiverId,
			participantId: request.senderId,
			startTime: request.requestedTime,
			subject: "Accepted Meeting Request",
			location: payload.location || "Department Office",
			meetingLink: payload.meetingLink || null,
			status: "scheduled",
		});
	} else if (action === "reject") {
		request.status = "rejected";
		request.rejectionReason = payload.reason;
	} else if (action === "reschedule") {
		request.requestedTime = payload.newDateTime;
		request.status = "pending";
	}

	return await request.save();
};
