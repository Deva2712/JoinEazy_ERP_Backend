import { getDashboard, requestMeeting, submitFeedback } from "./mentoring-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const dashboard = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await getDashboard(req.user.id)) });
});
export const meetingRequest = asyncHandler(async (req, res) => {
  const { mentee_id, ...data } = req.body;
  res.status(201).json({ success: true, ...(await requestMeeting(req.user.id, mentee_id, data)) });
});
export const feedback = asyncHandler(async (req, res) => {
  const { mentee_id, ...data } = req.body;
  res.status(201).json({ success: true, ...(await submitFeedback(req.user.id, mentee_id, data)) });
});