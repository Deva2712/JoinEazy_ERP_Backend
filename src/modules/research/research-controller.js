// src/modules/research/research-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./research-service.js";

export const dashboard          = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getDashboard(req.user.id) }));
export const create             = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.createResearch(req.user.id, req.body) }));
export const update             = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.updateResearch(req.params.id, req.body, req.user.id) }));
export const createRole         = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.createRole(req.params.researchId, req.body) }));
export const updateRole         = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.updateRole(req.params.researchId, req.params.roleIndex, req.body) }));
export const deleteRole         = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.deleteRole(req.params.researchId, req.params.roleId) }));
export const getTimeline        = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getTimeline(req.params.researchId) }));
export const addTimelineEvent   = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.addTimelineEvent(req.params.researchId, req.body) }));
export const deleteTimelineEvent= asyncHandler(async (req, res) => res.json({ success: true, data: await svc.deleteTimelineEvent(req.params.researchId, req.params.eventId) }));
export const updateTimelineEvent= asyncHandler(async (req, res) => res.json({ success: true, data: await svc.updateTimelineEvent(req.params.researchId, req.params.eventId, req.body) }));
export const apply              = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.applyToResearch(req.params.id, req.user.id, req.body) }));
export const star               = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.starResearch(req.params.id, req.user.id) }));
export const handleApplication  = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.handleApplication(req.params.applicationId, req.params.action, req.body) }));
export const getUsers           = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getUsers() }));
export const getUserById        = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getUserById(req.params.userId) }));
export const getUserProfile     = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getUserProfile(req.params.userId) }));
export const updateUserProfile  = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.updateUserProfile(req.params.userId, req.body) }));