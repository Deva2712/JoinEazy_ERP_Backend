import Payroll from "./payroll-model.js";

// Fetches all payroll records for a user, sorted by payment date (newest first)
export const getPayrollHistory = async (userId) => {
	return await Payroll.findAll({
		where: { userId },
		order: [["paidAt", "DESC"]],
	});
};

// Finds the most recent successful payment and extracts the 'breakdown' JSON field
export const getCurrentBreakdown = async (userId) => {
	const current = await Payroll.findOne({
		where: { userId, status: "Paid" },
		order: [["paidAt", "DESC"]],
	});

	if (!current) {
		const err = new Error("No current payroll breakdown found");
		err.statusCode = 404;
		throw err;
	}

	return current.breakdown;
};

/**
 * Transforms database record into the specific 'item/breakdown' schema
 * required by the frontend's downloadPayslip PDF utility.
 */
export const getPayrollReportData = async (payrollId, userId) => {
	const payroll = await Payroll.findOne({
		where: { id: payrollId, userId },
	});

	if (!payroll) {
		const err = new Error("Payroll record not found");
		err.statusCode = 404;
		throw err;
	}

    // Fallback to createdAt if payment date isn't set yet
	const reportYear = payroll.paidAt 
		? new Date(payroll.paidAt).getFullYear() 
		: new Date(payroll.createdAt).getFullYear();

	return {
		item: {
            // PDF Header Information
			id: payroll.payrollId,
			month: payroll.month,
			year: reportYear,
		},
		breakdown: {
            // PDF Table and Summary Data
			earnings: payroll.breakdown.earnings,
			deductions: payroll.breakdown.deductions,
			netPay: payroll.breakdown.amount || payroll.amount,
		},
	};
};
