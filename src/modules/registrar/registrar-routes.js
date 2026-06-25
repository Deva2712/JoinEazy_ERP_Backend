import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import { asyncHandler } from "../../middleware/error.middleware.js";
import { upload } from "../../middleware/upload.middleware.js";
import * as svc from "./registrar-service.js";

const router = express.Router();

// ─── Document Requests ────────────────────────────────────────────────────────
router.get("/overview", protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.getOverview(req.user.id) });
}));

router.get("/requests", protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.getRequests(req.user.id) });
}));

router.post("/requests", protect, ...upload("file", "registrar/docs"), asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await svc.createRequest(req.user.id, req.body, req.file || null) });
}));

router.delete("/requests/:requestId", protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.cancelRequest(req.params.requestId, req.user.id) });
}));

// GET single request
router.get("/requests/:requestId", protect, asyncHandler(async (req, res) => {
  const requests = await svc.getRequests(req.user.id);
  const request  = requests.requests?.find(r => r.id === req.params.requestId);
  if (!request) return res.status(404).json({ success: false, error: "Request not found" });
  res.json({ success: true, data: request });
}));

// PATCH — student updates a pending request
router.patch("/requests/:requestId", protect, asyncHandler(async (req, res) => {
  const { RegistrarRequest } = await import("./registrar-model.js");
  const request = await RegistrarRequest.findOne({ where: { id: req.params.requestId, student_id: req.user.id } });
  if (!request) return res.status(404).json({ success: false, error: "Request not found" });
  if (request.status !== "pending") return res.status(400).json({ success: false, error: "Only pending requests can be updated" });
  await request.update(req.body);
  res.json({ success: true, data: request.toJSON() });
}));

// ─── LOR ──────────────────────────────────────────────────────────────────────
router.get("/lor", protect, asyncHandler(async (req, res) => {
  // Prof gets their assigned LOR inbox; student gets their own
  const data = await svc.getLorRequests(req.user.id, req.user.role);
  res.json({ success: true, data });
}));

router.post("/lor", protect, ...upload("file", "registrar/docs"), asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await svc.createLorRequest(req.user.id, req.body, req.file || null) });
}));

router.delete("/lor/:requestId", protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.cancelLorRequest(req.params.requestId, req.user.id) });
}));

// Prof — approve LOR request
router.patch("/lor/:requestId/approve", protect, authorize("professor", "admin"), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.approveLorRequest(req.params.requestId, req.body.remarks) });
}));

// Prof — reject LOR request
router.patch("/lor/:requestId/reject", protect, authorize("professor", "admin"), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.rejectLorRequest(req.params.requestId, req.body.remarks) });
}));

// Prof — submit final LOR file
router.post("/lor/:requestId/submit", protect, authorize("professor", "admin"), ...upload("lorFile", "registrar/lor-files"), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.submitLor(req.params.requestId, req.body.remarks, req.file || null) });
}));

// Student — schedule meeting for LOR
router.post("/lor/:requestId/meeting", protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.scheduleLorMeeting(req.params.requestId, req.user.id, req.body.meetingTime) });
}));

export default router;