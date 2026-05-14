import express from "express";
import * as ctrl from "./schedule-controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

// All routes below require authentication
router.use(protect);

// Main schedule and availability
router.get("/", ctrl.getOverview);
router.put("/", ctrl.setAvailability);

// Meeting management
router.post("/meetings", ctrl.addManualEvent);
router.post("/meetings/direct", ctrl.bookMeeting);

// Request workflow
router.post("/requests/outgoing", ctrl.sendRequest);
router.post(
	"/meetings/:requestId/:action(accept|reject|reschedule)",
	ctrl.handleRequestAction,
);

export default router;
