// src/modules/session-planning/student-sessions-routes.js
import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as svc from "./session-planning-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

const router = express.Router();
router.use(protect);

// GET /student/sessions
router.get("/sessions", asyncHandler(async (req, res) =>
  res.json({ success: true, data: await svc.getStudentSessions(req.user.id) })
));

export default router;