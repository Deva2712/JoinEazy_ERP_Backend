// src/modules/research/student-research-routes.js
// Mounted at: /api/v1/student/research
// Matches: studentResearch.service.js paths
import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import * as ctrl from "./student-research-controller.js";

const router = express.Router();
router.use(protect);
router.use(authorize("student"));

// GET  /student/research/dashboard-sync  — full dashboard data
router.get("/dashboard-sync",       ctrl.dashboard);

// POST /student/research/apply/:id      — apply to project/publication
router.post("/apply/:id",           ctrl.apply);

// POST /student/research/star/:id       — toggle star
router.post("/star/:id",            ctrl.star);

// GET  /student/research/my-applications
router.get("/my-applications",      ctrl.myApplications);

export default router;