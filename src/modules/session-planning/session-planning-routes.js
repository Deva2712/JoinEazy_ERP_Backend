import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import { schedules, today, reflections, documents, bulkDocuments } from "./session-planning-controller.js";

const router = express.Router();

router.get("/schedules", protect, schedules);
router.get("/today", protect, today);
router.get("/reflections", protect, reflections);
router.get("/documents/:courseId", protect, documents);
router.post("/documents/:courseId/bulk", protect, authorize("professor","admin"), bulkDocuments);

export default router;