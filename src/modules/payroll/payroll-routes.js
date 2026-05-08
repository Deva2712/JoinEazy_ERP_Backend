import express from "express";
import { getHistory, getBreakdown, download } from "./payroll-controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

// All routes below require authentication
router.use(protect);

// Matches: getHistory()
router.get("/history", getHistory);

// Matches: getBreakdown()
router.get("/breakdown", getBreakdown);

// Matches: downloadPayslip()
router.get("/download/:id", download);

export default router;
