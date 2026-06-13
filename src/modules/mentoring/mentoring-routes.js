import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { dashboard, meetingRequest, feedback } from "./mentoring-controller.js";

const router = express.Router();

router.get("/dashboard", protect, dashboard);
router.post("/meetings/request", protect, meetingRequest);
router.post("/feedback", protect, feedback);

export default router;