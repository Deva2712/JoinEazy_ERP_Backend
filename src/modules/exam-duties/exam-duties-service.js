import ExamDuty from "./exam-duties-model.js";

export const getDutySchedule = async (userId) => {
	return await ExamDuty.findAll({
		where: { userId },
		order: [["startTime", "ASC"]],
	});
};

/**
 * Updates duty status and manages the rejection workflow state.
 * If status is reset to 'ASSIGNED', previous rejection approvals are cleared.
 */
export const updateDuty = async (id, userId, updateData) => {
	const duty = await ExamDuty.findOne({ where: { id, userId } });

	if (!duty) {
		const err = new Error("Duty assignment not found");
		err.statusCode = 404;
		throw err;
	}

	const { status, isCheckedIn, reason, rejectionApproval } = updateData;

	const updatePayload = {
		status: status || duty.status,
		isCheckedIn: isCheckedIn !== undefined ? isCheckedIn : duty.isCheckedIn,
		rejectionReason: reason || duty.rejectionReason,
	};

	// Handle rejection workflow state logic
	if (rejectionApproval) {
		updatePayload.rejectionApproval = rejectionApproval;
	} else if (status === "ASSIGNED") {
		updatePayload.rejectionApproval = null;
	}

	return await duty.update(updatePayload);
};
