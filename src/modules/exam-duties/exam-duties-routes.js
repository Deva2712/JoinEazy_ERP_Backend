import express from "express";
import { getDuties, updateDutyStatus } from "./exam-controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

// All routes below require authentication
router.use(protect);

// Matches: getDuties()
router.get("/duties", getDuties);

// Matches: updateDutyStatus(id, payload)
router.post("/duty/status", updateDutyStatus);

export default router;
