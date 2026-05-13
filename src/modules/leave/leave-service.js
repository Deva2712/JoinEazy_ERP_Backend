import { LeaveApplication } from "./leave-model.js";

/**
 * Fetches applications for a specific user.
 */
export const getUserApplications = async (userId) => {
	return await LeaveApplication.findAll({
		where: { applicantId: userId },
		order: [["createdAt", "DESC"]],
	});
};

/**
 * Creates a new leave entry.
 */
export const applyForLeave = async (userId, data) => {
	return await LeaveApplication.create({
		...data,
		applicantId: userId,
	});
};

/**
 * Updates application data and resets status for resubmission.
 */
export const modifyApplication = async (id, data) => {
	const application = await LeaveApplication.findByPk(id);
	if (!application) throw new Error("Application not found");

	return await application.update({
		...data,
		status: "Pending", // Reset status on update
	});
};

/**
 * HoD Logic: Get requests where the user is the assigned approver.
 */
export const getDepartmentRequests = async (hodId) => {
	// In a real DB, this would filter by the applicant's department
	return await LeaveApplication.findAll({
		where: { isArchived: false },
		include: ["applicant"],
	});
};

/**
 * Updates the specific role's approval status within the JSONB field.
 */
export const processApproval = async (
	id,
	{ role, action, remark, isArchived },
) => {
	const application = await LeaveApplication.findByPk(id);
	if (!application) throw new Error("Application not found");

	const roleKey = role === "HOD" ? "HoD" : role;
	const updatedApproval = {
		...application.leaveApproval,
		[roleKey]: { status: action, remark: remark || null },
	};

	return await application.update({
		leaveApproval: updatedApproval,
		status: action,
		isArchived: action === "Rejected" ? (isArchived ?? true) : false,
	});
};

/**
 * Updates the substitution status based on colleague response.
 */
export const handleSubstitution = async (id, action) => {
	const application = await LeaveApplication.findByPk(id);
	if (!application) throw new Error("Request not found");

	return await application.update({ substitutionStatus: action });
};
