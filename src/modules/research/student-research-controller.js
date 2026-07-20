// src/modules/research/student-research-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./student-research-service.js";

export const dashboard       = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getStudentDashboard(req.user.id) }));
export const apply           = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.applyToResearch(req.params.id, req.user.id, req.body) }));
export const star            = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.starResearch(req.params.id, req.user.id) }));
export const myApplications  = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getMyApplications(req.user.id) }));