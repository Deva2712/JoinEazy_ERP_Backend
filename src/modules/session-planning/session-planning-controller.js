// src/modules/session-planning/session-planning-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./session-planning-service.js";

// ── Professor ─────────────────────────────────────────────────────────────────
export const getSchedules     = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getSchedules(req.user.id) }));
export const getTodaysClasses = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getTodaysClasses(req.user.id) }));
export const archiveSection   = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.archiveSection(req.params.sectionId, req.user.id) }));

export const getReflections = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await svc.getReflections(req.user.id, req.query.sectionId) })
);
export const saveReflection = asyncHandler(async (req, res) =>
  res.status(201).json({ success: true, data: await svc.saveReflection(req.user.id, req.body) })
);

export const getDocuments = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await svc.getDocuments(req.params.courseId) })
);
export const uploadDocuments = asyncHandler(async (req, res) => {
  const { docs = [], fileNames = {} } = req.body;
  res.status(201).json({ success: true, data: await svc.uploadDocuments(req.params.courseId, docs, fileNames) });
});

// ── Student ────────────────────────────────────────────────────────────────────
export const getStudentSessions = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await svc.getStudentSessions(req.user.id) })
);