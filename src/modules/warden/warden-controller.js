// src/modules/warden/warden-controller.js
import {
  getWardenDashboard,
  updateLeaveStatus,
  updateOutingProgress,
  updateMaintenanceStatus,
  updateComplaintStatus,
  setRoomAllotment,
} from "../hostel/hostel-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

// ─── GET full hostel overview (all students, all requests) ───────────────────
export const dashboard = asyncHandler(async (req, res) => {
  const data = await getWardenDashboard();
  res.status(200).json({ success: true, data });
});

// ─── Approve/Reject leave ──────────────────────────────────────────────────
export const decideLeave = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  const leave = await updateLeaveStatus(req.params.id, status, rejectionReason);
  res.status(200).json({ success: true, data: leave });
});

// ─── Move outing through steps / approve / reject ────────────────────────────
export const decideOuting = asyncHandler(async (req, res) => {
  const outing = await updateOutingProgress(req.params.id, req.body);
  res.status(200).json({ success: true, data: outing });
});

// ─── Update maintenance status / add progress step ───────────────────────────
export const decideMaintenance = asyncHandler(async (req, res) => {
  const request = await updateMaintenanceStatus(req.params.id, req.body);
  res.status(200).json({ success: true, data: request });
});

// ─── Update complaint status ──────────────────────────────────────────────────
export const decideComplaint = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const complaint = await updateComplaintStatus(req.params.id, status);
  res.status(200).json({ success: true, data: complaint });
});

// ─── Allot / update a student's room ──────────────────────────────────────────
export const allotRoom = asyncHandler(async (req, res) => {
  const { studentId, ...roomData } = req.body;
  const room = await setRoomAllotment(studentId, roomData);
  res.status(200).json({ success: true, data: room });
});