import * as service from "./research-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

// Fetch consolidated dashboard data (Projects, Publications, Grants, and Researchers)
export const getResearchDashboard = asyncHandler(async (req, res) => {
	const data = await service.getDashboardData(req.user.id);
	res.status(200).json({ success: true, data });
});

// Create a new research entry (Project or Publication)
export const createResearchWork = asyncHandler(async (req, res) => {
	const newEntry = await service.createEntry(req.body);
	res.status(201).json({ success: true, data: newEntry });
});

// Update project details, including member acceptance and role management
export const updateResearchWork = asyncHandler(async (req, res) => {
	const result = await service.updateEntry(req.params.id, req.body);
	res.status(200).json({
		success: true,
		message: "Research work updated successfully",
		data: result,
	});
});

// Toggle the starred/favorite status for a research item
export const toggleStar = asyncHandler(async (req, res) => {
	const result = await service.toggleStarStatus(req.params.id);
	res.status(200).json({
		success: true,
		message: result.isStarred ? "Item starred" : "Item unstarred",
		data: result,
	});
});

// Manage open research roles (Create, Update, Delete)
export const handleRoleAction = asyncHandler(async (req, res) => {
	const { id, action, roleId } = req.params;
	const result = await service.processRoleChange(
		id,
		action,
		roleId,
		req.body,
	);
	res.status(200).json({ success: true, data: result });
});

// Retrieve or modify the timeline events of a research project
export const handleTimelineAction = asyncHandler(async (req, res) => {
	const { id, eventId } = req.params;
	const result = await service.processTimelineChange(
		id,
		eventId,
		req.method,
		req.body,
	);
	res.status(200).json({ success: true, data: result });
});

// Submit a new application for a research position
export const submitApplication = asyncHandler(async (req, res) => {
	await service.applyToResearch(req.params.id, req.body);
	res.status(200).json({
		success: true,
		message: "Application submitted successfully",
	});
});

// Process application status (Accept/Reject/Meeting)
export const processApplication = asyncHandler(async (req, res) => {
	const { appId, action } = req.params;
	const result = await service.handleApplicationAction(appId, action);
	res.status(200).json({
		success: true,
		message: `Application ${action}.`,
		data: result,
	});
});

// Submit a grant request with initial documentation
export const createGrantRequest = asyncHandler(async (req, res) => {
	const grant = await service.submitGrant(req.body);
	res.status(201).json({
		success: true,
		data: grant,
		message: "Grant request submitted successfully",
	});
});

// Update and resubmit a grant, maintaining version history
export const resubmitGrantRequest = asyncHandler(async (req, res) => {
	const grant = await service.updateGrant(req.params.id, req.body);
	res.status(200).json({
		success: true,
		data: grant,
		message: "Grant resubmitted successfully with version history.",
	});
});

// Fetch a researcher profile with hydrated project/publication details
export const getUserProfile = asyncHandler(async (req, res) => {
	const profile = await service.fetchProfile(req.params.userId);
	res.status(200).json({ success: true, data: profile });
});

// Update researcher profile information
export const updateProfile = asyncHandler(async (req, res) => {
	const updated = await service.modifyProfile(req.params.userId, req.body);
	res.status(200).json({ success: true, data: updated });
});
