import FinanceRecord from "./finance-model.js";

export const getFinanceHistory = async (userId, type) => {
	return await FinanceRecord.findAll({
		where: { userId, type },
		order: [["createdAt", "DESC"]],
	});
};

export const createFinanceRequest = async (userId, type, data) => {
	return await FinanceRecord.create({
		...data,
		userId,
		type,
		status: "Pending",
	});
};

/**
 * Updates a record and archives the current state into 'previousVersion'.
 * Resets status to 'Resubmitted' for admin re-review.
 */
export const resubmitFinanceRequest = async (id, userId, type, updateData) => {
	const existing = await FinanceRecord.findOne({
		where: { id, userId, type },
	});

	if (!existing) {
		const err = new Error("Record not found");
		err.statusCode = 404;
		throw err;
	}

	const previousLog = {
		title: existing.title,
		category: existing.category,
		description: existing.description,
		amount: existing.amount,
		adminComments: existing.adminComments,
		proofDocLink: existing.proofDocLink,
	};

	return await existing.update({
		...updateData,
		status: "Resubmitted",
		adminComments: null,
		approvalTime: null,
		previousVersion: previousLog,
	});
};
