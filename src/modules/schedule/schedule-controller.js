import { asyncHandler } from "../../middleware/error.middleware.js";
import { getProfessorSchedule, upsertSchedule, getMeetingRequests, updateMeetingStatus, createOutgoingRequest, createMeetingRequest } from "./schedule-service.js";

export const getSchedule = asyncHandler(async (req, res) => {
  const data = await getProfessorSchedule(req.user.id);
  res.json({ success: true, data });
});

export const addSchedule = asyncHandler(async (req, res) => {
  const data = await upsertSchedule(req.user.id, req.body);
  res.json({ success: true, data });
});

export const getMeetings = asyncHandler(async (req, res) => {
  const data = await getMeetingRequests(req.user.id);
  res.json({ success: true, data });
});

export const acceptMeeting = asyncHandler(async (req, res) => {
  const data = await updateMeetingStatus(req.params.requestId, "accepted");
  res.json({ success: true, data });
});

export const rejectMeeting = asyncHandler(async (req, res) => {
  const data = await updateMeetingStatus(req.params.requestId, "rejected");
  res.json({ success: true, data });
});

export const rescheduleMeeting = asyncHandler(async (req, res) => {
  const data = await updateMeetingStatus(req.params.requestId, "rescheduled", req.body.newDateTime);
  res.json({ success: true, data });
});
export const createMeeting = asyncHandler(async (req, res) => {
  const data = await createMeetingRequest(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const createOutgoing = asyncHandler(async (req, res) => {
  const data = await createMeetingRequest(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});