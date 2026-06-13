import { getOverview, register, swapCourse, submitFeedback } from "./courses-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const overview = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await getOverview(req.user.id)) });
});
export const registerCourse = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, ...(await register(req.user.id, req.body.cohort_id)) });
});
export const swap = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await swapCourse(req.params.regId, req.user.id, req.body.swap_request)) });
});
export const feedback = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, ...(await submitFeedback(req.user.id, req.params.cohortId, req.body)) });
});