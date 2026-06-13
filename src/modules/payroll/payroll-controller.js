import { getHistory, getBreakdown } from "./payroll-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const payrollHistory = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await getHistory(req.user.id)) });
});
export const payrollBreakdown = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  res.status(200).json({ success: true, ...(await getBreakdown(req.user.id, month, year)) });
});
export const downloadSlip = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, url: null, message: "Slip download not configured" });
});