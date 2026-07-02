// src/modules/hostel/hostel-controller.js
import {
  getDashboard,
  createLeaveRequest,
  createOutingRequest,
  createMaintenanceRequest,
  createComplaint,
  updateLeaveStatus,
  updateOutingProgress,
  updateMaintenanceStatus,
  updateComplaintStatus,
  setRoomAllotment,
} from "./hostel-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

// ─── Student-facing ────────────────────────────────────────────────────────
export const dashboard = asyncHandler(async (req, res) => {
  const data = await getDashboard(req.user.id);
  res.status(200).json({ success: true, data });
});

export const submitLeave = asyncHandler(async (req, res) => {
  const leave = await createLeaveRequest(req.user.id, req.body);
  res.status(201).json({ success: true, data: leave });
});

export const submitOuting = asyncHandler(async (req, res) => {
  const outing = await createOutingRequest(req.user.id, req.body);
  res.status(201).json({ success: true, data: outing });
});

export const submitMaintenance = asyncHandler(async (req, res) => {
  const request = await createMaintenanceRequest(req.user.id, req.body);
  res.status(201).json({ success: true, data: request });
});

export const submitComplaint = asyncHandler(async (req, res) => {
  const complaint = await createComplaint(req.user.id, req.body);
  res.status(201).json({ success: true, data: complaint });
});

// ─── Admin / Warden facing ─────────────────────────────────────────────────
export const updateLeave = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  const leave = await updateLeaveStatus(req.params.id, status, rejectionReason);
  res.status(200).json({ success: true, data: leave });
});

export const updateOuting = asyncHandler(async (req, res) => {
  const outing = await updateOutingProgress(req.params.id, req.body);
  res.status(200).json({ success: true, data: outing });
});

export const updateMaintenance = asyncHandler(async (req, res) => {
  const request = await updateMaintenanceStatus(req.params.id, req.body);
  res.status(200).json({ success: true, data: request });
});

export const updateComplaint = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const complaint = await updateComplaintStatus(req.params.id, status);
  res.status(200).json({ success: true, data: complaint });
});

export const allotRoom = asyncHandler(async (req, res) => {
  const { studentId, ...data } = req.body;
  const room = await setRoomAllotment(studentId, data);
  res.status(200).json({ success: true, data: room });
});