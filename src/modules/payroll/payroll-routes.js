import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { payrollHistory, payrollBreakdown, downloadSlip } from "./payroll-controller.js";

const router = express.Router();

router.get("/history", protect, payrollHistory);
router.get("/breakdown", protect, payrollBreakdown);
router.get("/download/:id", protect, downloadSlip);

export default router;