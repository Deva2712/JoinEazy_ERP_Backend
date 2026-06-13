import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import { getExamDuties, updateExamDutyStatus } from "./exam-duties-controller.js";

const router = express.Router();

router.get("/duties", protect, authorize("professor", "admin"), getExamDuties);
router.post("/duty/status", protect, authorize("professor", "admin"), updateExamDutyStatus);

export default router;