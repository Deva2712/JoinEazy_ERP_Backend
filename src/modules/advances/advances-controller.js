import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./advances-service.js";

export const getAdvances    = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getAdvances(req.user.id) }));
export const createAdvance  = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.createAdvance(req.user.id, req.user.name, req.body) }));
export const updateAdvance  = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.updateAdvance(req.params.advanceId, req.user.id, req.body) }));
export const deleteAdvance  = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.deleteAdvance(req.params.advanceId, req.user.id) }));