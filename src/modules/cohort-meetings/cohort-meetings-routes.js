import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import * as ctrl from "./cohort-meetings-controller.js";

// ── Student router — mounted at /api/v1/cohort/:cohortId/student ──────────────
const studentRouter = express.Router({ mergeParams: true });
studentRouter.use(protect);
studentRouter.get("/meetings",                       ctrl.getStudentMeetings);
studentRouter.get("/meeting-requests",               ctrl.getStudentMeetingRequests);
studentRouter.post("/meeting-requests",              ctrl.createMeetingRequest);
studentRouter.delete("/meeting-requests/:requestId", ctrl.cancelMeetingRequest);

// ── Professor router — mounted at /api/v1/cohort/:cohortId/prof ───────────────
const profRouter = express.Router({ mergeParams: true });
profRouter.use(protect, authorize("professor", "admin"));
profRouter.get("/meeting-requests",                           ctrl.getProfMeetingRequests);
profRouter.post("/meeting-requests/:requestId/accept",        ctrl.acceptProfMeetingRequest);
profRouter.post("/meeting-requests/:requestId/reject",        ctrl.rejectProfMeetingRequest);
profRouter.get("/",                                           ctrl.getMeetings);
profRouter.post("/",                                          ctrl.createMeeting);

// ── Legacy CRUD router — mounted at /api/v1/cohort/:cohortId/meetings ─────────
const meetingsRouter = express.Router({ mergeParams: true });
meetingsRouter.use(protect);
meetingsRouter.get("/",               ctrl.getMeetings);
meetingsRouter.post("/",              ctrl.createMeeting);
meetingsRouter.put("/:meetingId",     ctrl.updateMeeting);
meetingsRouter.delete("/:meetingId",  ctrl.deleteMeeting);

export { studentRouter, profRouter, meetingsRouter };