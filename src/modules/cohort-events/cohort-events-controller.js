import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./cohort-events-service.js";
import User from "../auth/auth-model.js";

export const getEvents = asyncHandler(async (req, res) => {
  const data = await svc.getEvents(req.params.cohortId, req.user.id);
  res.json({ success: true, data });
});

export const getEventById = asyncHandler(async (req, res) => {
  const data = await svc.getEventById(req.params.eventId, req.user.id);
  res.json({ success: true, data });
});

export const createEvent = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: ["name"] });
  const data = await svc.createEvent(req.params.cohortId, req.body, req.user.id, user?.name);
  res.status(201).json({ success: true, data });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const data = await svc.updateEvent(req.params.cohortId, req.params.eventId, req.body, req.user.id);
  res.json({ success: true, data });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const data = await svc.deleteEvent(req.params.cohortId, req.params.eventId, req.user.id);
  res.json({ success: true, data });
});

export const updateGoingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const data = await svc.updateGoingStatus(req.params.eventId, req.user.id, status);
  res.json({ success: true, data });
});

export const handleEventRequest = asyncHandler(async (req, res) => {
  const { action, location } = req.body;
  const data = await svc.handleEventRequest(req.params.eventId, action, req.params.cohortId, location);
  res.json({ success: true, data });
});

export const addComment = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: ["name"] });
  const data = await svc.addComment(req.params.eventId, req.user.id, { ...req.body, user_name: user?.name });
  res.status(201).json({ success: true, data });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const data = await svc.deleteComment(req.params.commentId, req.user.id);
  res.json({ success: true, data });
});
