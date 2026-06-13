import { getDuties, updateDutyStatus } from "./exam-duties-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const getExamDuties = asyncHandler(async (req, res) => {
  const result = await getDuties(req.user.id);
  res.status(200).json({ success: true, ...result });
});

export const updateExamDutyStatus = asyncHandler(async (req, res) => {
  const { id } = req.body;
  const result = await updateDutyStatus(id, req.user.id, req.body);
  res.status(200).json({ success: true, ...result });
});