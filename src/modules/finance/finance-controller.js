import * as service from "./finance-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

// Handles retrieval of financial lists based on type (expenses/advances).
export const getRecords = asyncHandler(async (req, res) => {
	const { type } = req.params;
	const records = await service.getFinanceHistory(req.user.id, type);
	res.status(200).json({ success: true, data: records });
});

// Processes new financial requests.
export const createRecord = asyncHandler(async (req, res) => {
	const { type } = req.params;
	const record = await service.createFinanceRequest(
		req.user.id,
		type,
		req.body,
	);
	res.status(201).json({ success: true, data: record });
});

// Handles the resubmission logic for rejected financial claims.
export const updateRecord = asyncHandler(async (req, res) => {
	const { type, id } = req.params;
	const updated = await service.resubmitFinanceRequest(
		id,
		req.user.id,
		type,
		req.body,
	);
	res.status(200).json({ success: true, data: updated });
});
