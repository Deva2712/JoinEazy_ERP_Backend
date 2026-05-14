import * as service from "./schedule-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const getOverview = asyncHandler(async (req, res) => {
	const data = await service.getProfessorSchedule(req.user.id);
	res.status(200).json({ success: true, data });
});

export const setAvailability = asyncHandler(async (req, res) => {
	const data = await service.updateOfficeHours(req.user.id, req.body);
	res.status(200).json({
		success: true,
		message: "Office hours updated successfully",
		data,
	});
});

export const addManualEvent = asyncHandler(async (req, res) => {
	const event = await service.createCalendarEvent(req.user.id, req.body);
	res.status(201).json({
		success: true,
		message: "Event added to schedule successfully",
		data: event,
	});
});

export const bookMeeting = asyncHandler(async (req, res) => {
	const meeting = await service.scheduleDirectMeeting(req.user.id, req.body);
	res.status(201).json({
		success: true,
		message: "Meeting scheduled directly",
		data: meeting,
	});
});

export const sendRequest = asyncHandler(async (req, res) => {
	const request = await service.createOutgoingRequest(req.user.id, req.body);
	res.status(201).json({
		success: true,
		message: "Meeting request sent successfully",
		data: request,
	});
});

export const handleRequestAction = asyncHandler(async (req, res) => {
	const { requestId, action } = req.params;
	const result = await service.processMeetingAction(
		requestId,
		action,
		req.body,
	);
	res.status(200).json({
		success: true,
		message: `Meeting ${action}ed successfully`,
		data: result,
	});
});
