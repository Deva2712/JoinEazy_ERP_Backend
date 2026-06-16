import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./calendar-service.js";

export const getEvents   = asyncHandler(async (req, res) => {
  const data = await svc.getEvents(req.user.id, req.query.type);
  res.json({ success: true, data });
});

export const createEvent = asyncHandler(async (req, res) => {
  const data = await svc.createEvent(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const data = await svc.deleteEvent(req.params.eventId, req.user.id);
  res.json({ success: true, data });
});