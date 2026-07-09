// src/modules/mentoring/mentoring-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./mentoring-service.js";

export const dashboard = asyncHandler(async (req, res) => {
  const data = await svc.getDashboard(req.user.id);
  res.json({ success: true, data });
});

export const meetingRequest = asyncHandler(async (req, res) => {
  const data = await svc.requestMeeting(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const feedback = asyncHandler(async (req, res) => {
  const data = await svc.submitFeedback(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});