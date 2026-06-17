import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as ctrl from "./job-tray-controller.js";

const router = express.Router();

router.get("/student/job-tray", protect, ctrl.getPendingJobs);
router.get("/job-tray",         protect, ctrl.getPendingJobs); // professor/admin variant
router.post("/job-tray/:jobId/done", protect, ctrl.markJobDone);

export default router;