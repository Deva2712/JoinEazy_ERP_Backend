import express from "express";
import { getHistory, getBreakdown, download } from "./payroll-controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

// All routes below require authentication
router.use(protect);

// Matches: GET /payroll/history
router.get("/history", getHistory);

// Matches: GET /payroll/breakdown
router.get("/breakdown", getBreakdown);

// Matches: GET /payroll/download/:id
router.get("/download/:id", download);

export default router;
