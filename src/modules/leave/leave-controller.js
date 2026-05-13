import * as service from "./leave-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

/**
 * Retrieves the current user's personal leave applications.
 */
export const getApplications = asyncHandler(async (req, res) => {
	const applications = await service.getUserApplications(req.user.id);
	res.status(200).json({ success: true, data: applications });
});

/**
 * Submits a new leave application.
 */
export const createApplication = asyncHandler(async (req, res) => {
	const application = await service.applyForLeave(req.user.id, req.body);
	res.status(201).json({ success: true, data: application });
});

/**
 * Updates an existing application (e.g., resubmitting after rejection).
 */
export const updateApplication = asyncHandler(async (req, res) => {
	const updated = await service.modifyApplication(req.params.id, req.body);
	res.status(200).json({ success: true, data: updated });
});

/**
 * Admin/HoD: Retrieves incoming leave requests from department faculty.
 */
export const getIncomingRequests = asyncHandler(async (req, res) => {
	const requests = await service.getDepartmentRequests(req.user.id);
	res.status(200).json({ success: true, data: requests });
});

/**
 * Approves or rejects a leave request.
 */
export const updateApproval = asyncHandler(async (req, res) => {
	const { role, action, remark, isArchived } = req.body;
	const result = await service.processApproval(req.params.id, {
		role,
		action,
		remark,
		isArchived,
	});
	res.status(200).json({ success: true, data: result });
});

/**
 * Allows a colleague to accept or decline a substitution request.
 */
export const respondToSubstitution = asyncHandler(async (req, res) => {
	const { action } = req.body;
	const result = await service.handleSubstitution(req.params.id, action);
	res.status(200).json({ success: true, data: result });
});
