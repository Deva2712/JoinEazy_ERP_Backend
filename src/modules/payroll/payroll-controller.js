import {
	getPayrollHistory,
	getCurrentBreakdown,
	getPayrollReportData,
} from "./payroll-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

// Handles the retrieval of all past payroll records for the authenticated user.
export const getHistory = asyncHandler(async (req, res) => {
	const history = await getPayrollHistory(req.user.id);
	res.status(200).json({ success: true, data: history });
});

// Retrieves the detailed earnings and deductions breakdown for the most recent payment.
export const getBreakdown = asyncHandler(async (req, res) => {
	const breakdown = await getCurrentBreakdown(req.user.id);
	res.status(200).json({ success: true, data: breakdown });
});

// Fetches specific payroll details formatted for the jsPDF generation utility.
export const download = asyncHandler(async (req, res) => {
	const { id } = req.params;

	// Basic validation to ensure the ID is a valid UUID before querying the DB
	if (
		!id.match(
			/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
		)
	) {
		const err = new Error("Invalid Payroll ID format");
		err.statusCode = 400;
		throw err;
	}

	const reportData = await getPayrollReportData(id, req.user.id);

	res.status(200).json({
		success: true,
		...reportData, // Returns { item, breakdown } for jsPDF utility
	});
});
