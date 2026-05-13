import * as service from "./exam-duties-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const getDuties = asyncHandler(async (req, res) => {
	const duties = await service.getDutySchedule(req.user.id);
	res.status(200).json({ success: true, data: duties });
});

export const updateDutyStatus = asyncHandler(async (req, res) => {
	const { id, ...payload } = req.body;
	const updated = await service.updateDuty(id, req.user.id, payload);
	res.status(200).json({ success: true, data: updated });
});
