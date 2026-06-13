import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import { getLeaveApplications, createLeaveApplication, updateLeaveApplication, approveLeave, substituteResponse } from "./leave-controller.js";

const router = express.Router();

router.get("/applications", protect, getLeaveApplications);
router.post("/apply", protect, createLeaveApplication);
router.post("/update/:id", protect, updateLeaveApplication);
router.post("/approve/:id", protect, authorize("hod", "hr", "admin"), approveLeave);
router.post("/substitutions/:id", protect, substituteResponse);

export default router;