// src/modules/session-planning/session-planning-routes.js
import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import * as ctrl from "./session-planning-controller.js";

const router = express.Router();
router.use(protect);

// ── Professor routes — /sessions/* ────────────────────────────────────────────
router.get("/schedules",                  authorize("professor","admin"), ctrl.getSchedules);
router.get("/today",                      authorize("professor","admin"), ctrl.getTodaysClasses);
router.post("/:sectionId/archive",        authorize("professor","admin"), ctrl.archiveSection);

router.get("/reflections",                authorize("professor","admin"), ctrl.getReflections);
router.post("/reflections",               authorize("professor","admin"), ctrl.saveReflection);

router.get("/documents/:courseId",        authorize("professor","admin"), ctrl.getDocuments);
router.post("/documents/:courseId/bulk",  authorize("professor","admin"), ctrl.uploadDocuments);

export default router;