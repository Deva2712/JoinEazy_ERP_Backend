// src/modules/research/student-research-routes.js
// Mounted at: /api/v1/student/research
// Matches: studentResearch.service.js paths

import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { asyncHandler } from "../../middleware/error.middleware.js";
import { getStudentDashboard, applyToResearch, starResearch } from "./research-service.js";

const router = express.Router();
router.use(protect);

// GET /student/research/dashboard
// Returns: { myProjects, myPublications, availableProjects, availablePublications, myApplications, allUsers }
router.get("/dashboard", asyncHandler(async (req, res) => {
  const data = await getStudentDashboard(req.user.id);
  res.json({ success: true, data });
}));

// POST /student/research/apply/:itemId
// body: { itemType, statement, availability, ... }
router.post("/apply/:itemId", asyncHandler(async (req, res) => {
  const data = await applyToResearch(req.params.itemId, req.user.id, req.body);
  res.status(201).json({ success: true, data });
}));

// POST /student/research/star/:itemId
router.post("/star/:itemId", asyncHandler(async (req, res) => {
  const data = await starResearch(req.params.itemId, req.user.id);
  res.json({ success: true, data });
}));

export default router;