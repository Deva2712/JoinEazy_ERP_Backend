// src/modules/warden/warden-routes.js
import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import {
  dashboard,
  decideLeave,
  decideOuting,
  decideMaintenance,
  decideComplaint,
  allotRoom,
} from "./warden-controller.js";

const router = express.Router();

router.use(protect, authorize("warden", "admin"));

router.get("/dashboard", dashboard);

router.post("/leave/:id/decision",        decideLeave);
router.post("/outing/:id/decision",       decideOuting);
router.post("/maintenance/:id/decision",  decideMaintenance);
router.post("/complaints/:id/decision",   decideComplaint);

router.post("/room-allotment", allotRoom);

export default router;