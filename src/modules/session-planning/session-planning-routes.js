// src/modules/session-planning/session-planning-routes.js
import express from "express";
import multer from "multer";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import * as ctrl from "./session-planning-controller.js";

const router = express.Router();
router.use(protect);

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: "courseOutline",         maxCount: 1 },
  { name: "timeline",              maxCount: 1 },
  { name: "assessmentPlan",        maxCount: 1 },
  { name: "previousYearAnalysis",  maxCount: 1 },
]);

// ── Professor routes — /sessions/* ────────────────────────────────────────────
router.get("/schedules",                  authorize("professor","admin"), ctrl.getSchedules);
router.get("/today",                      authorize("professor","admin"), ctrl.getTodaysClasses);
router.post("/:sectionId/archive",        authorize("professor","admin"), ctrl.archiveSection);

router.get("/reflections",                authorize("professor","admin"), ctrl.getReflections);
router.post("/reflections",               authorize("professor","admin"), ctrl.saveReflection);

router.get("/documents/:courseId",        authorize("professor","admin"), ctrl.getDocuments);
router.post("/documents/:courseId/bulk",  authorize("professor","admin"), documentUpload, ctrl.uploadDocuments);

export default router;