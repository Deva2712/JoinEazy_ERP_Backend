// src/modules/placement/placement-routes.js
import express from "express";
import multer from "multer";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import * as ctrl from "./placement-controller.js";

const router = express.Router();

// File upload middleware (memory — S3 pe jaayega service mein)
const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
}).single("file"); // frontend fd.append("resume", file) — field name "resume" ya "portfolio"

const resumeUpload   = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }).single("resume");
const portfolioUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }).single("portfolio");

// ── All routes require login ──────────────────────────────────────────────────
router.use(protect);

// ── Overview (single round-trip) ─────────────────────────────────────────────
// GET /placement/overview
router.get("/overview", ctrl.getPlacementOverview);

// ── Jobs ──────────────────────────────────────────────────────────────────────
// GET  /placement/jobs
// POST /placement/jobs          (admin/placement cell only)
// GET  /placement/jobs/:jobId
// PUT  /placement/jobs/:jobId   (admin only)
// DEL  /placement/jobs/:jobId   (admin only)
router.get("/jobs",          ctrl.getJobs);
router.post("/jobs",         authorize("admin", "placement"), ctrl.createJob);
router.get("/jobs/:jobId",   ctrl.getJobById);
router.put("/jobs/:jobId",   authorize("admin", "placement"), ctrl.updateJob);
router.delete("/jobs/:jobId",authorize("admin", "placement"), ctrl.deleteJob);

// ── Applications ──────────────────────────────────────────────────────────────
// GET  /placement/applications              — student ke apne applications
// POST /placement/applications              — apply (applyToJob)
// GET  /placement/applications/:applicationId
// POST /placement/apply                     — submitApplication (full form)
// PUT  /placement/applications/:id/status   — admin: shortlist/select/reject + interview
router.get("/applications",                    ctrl.getApplications);
router.post("/applications",                   ctrl.applyToJob);
router.get("/applications/:applicationId",     ctrl.getApplicationById);
router.post("/apply",                          ctrl.submitApplication);
router.put("/applications/:applicationId/status", authorize("admin", "placement"), ctrl.updateApplicationStatus);

// ── Documents ─────────────────────────────────────────────────────────────────
// GET  /placement/documents
// POST /placement/documents/resume
// POST /placement/documents/portfolio
router.get("/documents",              ctrl.getDocuments);
router.post("/documents/resume",      resumeUpload,    ctrl.uploadResume);
router.post("/documents/portfolio",   portfolioUpload, ctrl.uploadPortfolio);

// ── History ───────────────────────────────────────────────────────────────────

router.get("/history",                  ctrl.getHistory);
router.post("/history",                 ctrl.addHistoryEntry);
router.delete("/history/:historyId",    ctrl.deleteHistoryEntry);

export default router;