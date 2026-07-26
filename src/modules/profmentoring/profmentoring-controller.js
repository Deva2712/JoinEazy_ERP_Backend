// src/modules/profmentoring/profmentoring-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./profmentoring-service.js";

export const getAssignedMentees = asyncHandler(async (req, res) => {
  const data = await svc.getAssignedMentees(req.user.id);
  res.json({ success: true, data });
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const data = await svc.updateMeetingAttendance(req.params.meetingId, req.user.id, req.body);
  res.json({ success: true, data });
});

export const submitNotes = asyncHandler(async (req, res) => {
  const data = await svc.submitMeetingNotes(req.params.meetingId, req.user.id, req.body);
  res.json({ success: true, data });
});

// Admin/HOD assigns a student to a professor as mentor
export const assignMentor = asyncHandler(async (req, res) => {
  const { studentId, mentorId } = req.body;
  if (!studentId || !mentorId) {
    res.status(400);
    throw new Error("studentId and mentorId are required");
  }
  const data = await svc.assignMentor(studentId, mentorId, req.user.id);
  res.json({ success: true, data });
});

// Admin/HOD helper: list students who don't have a mentor yet
export const getUnassignedStudents = asyncHandler(async (req, res) => {
  const data = await svc.getUnassignedStudents();
  res.json({ success: true, data });
});