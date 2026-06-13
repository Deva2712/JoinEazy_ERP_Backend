import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import { getSchedule, addSchedule, getMeetings, acceptMeeting, rejectMeeting, rescheduleMeeting } from "./schedule-controller.js";
import * as revalCtrl from "../revaluation/revaluation-controller.js";

const router = express.Router();

// ─── Schedule ─────────────────────────────────────────────────────────────────
router.get("/schedule",  protect, authorize("professor","admin"), getSchedule);
router.post("/schedule", protect, authorize("professor","admin"), addSchedule);
router.put("/schedule",  protect, authorize("professor","admin"), addSchedule);

// ─── Meetings ─────────────────────────────────────────────────────────────────
router.get("/meetings",                        protect, authorize("professor","admin"), getMeetings);
router.post("/meetings/:requestId/accept",     protect, authorize("professor","admin"), acceptMeeting);
router.post("/meetings/:requestId/reject",     protect, authorize("professor","admin"), rejectMeeting);
router.post("/meetings/:requestId/reschedule", protect, authorize("professor","admin"), rescheduleMeeting);

// ─── Revaluation (professor side) ────────────────────────────────────────────
router.get("/revaluation/overview",                      protect, authorize("professor","admin"), revalCtrl.profOverview);
router.get("/revaluation/requests",                      protect, authorize("professor","admin"), revalCtrl.profRequests);
router.post("/revaluation/requests/:requestId/accept",   protect, authorize("professor","admin"), revalCtrl.accept);
router.post("/revaluation/requests/:requestId/result",   protect, authorize("professor","admin"), revalCtrl.result);
router.post("/revaluation/requests/:requestId/reject",   protect, authorize("professor","admin"), revalCtrl.reject);

export default router;