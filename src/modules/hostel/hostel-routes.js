// src/modules/hostel/hostel-routes.js
import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import {
  dashboard,
  submitLeave,
  submitOuting,
  submitMaintenance,
  submitComplaint,
  updateLeave,
  updateOuting,
  updateMaintenance,
  updateComplaint,
  allotRoom,
} from "./hostel-controller.js";

const router = express.Router();

// ─── Student routes ────────────────────────────────────────────────────────
router.get("/dashboard",        protect, dashboard);
router.post("/leave",           protect, submitLeave);
router.post("/outing",          protect, submitOuting);
router.post("/maintenance",     protect, submitMaintenance);
router.post("/complaints",      protect, submitComplaint);

// ─── Admin / Warden routes ─────────────────────────────────────────────────
router.post("/leave/:id/status",        protect, authorize("admin", "professor", "staff", "warden"), updateLeave);
router.post("/outing/:id/status",       protect, authorize("admin", "professor", "staff", "warden"), updateOuting);
router.post("/maintenance/:id/status",  protect, authorize("admin", "professor", "staff", "warden"), updateMaintenance);
router.post("/complaints/:id/status",   protect, authorize("admin", "professor", "staff", "warden"), updateComplaint);
router.post("/room-allotment",          protect, authorize("admin", "professor", "staff", "warden"), allotRoom);

export default router;