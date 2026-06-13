// src/modules/maintenance/maintenance-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./maintenance-service.js";

export const getMyRequests = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await svc.getMyRequests(req.user.id) })
);

export const createRequest = asyncHandler(async (req, res) =>
  res.status(201).json({ success: true, data: await svc.createRequest(req.body, { id: req.user.id, name: req.user.name }) })
);

export const updateStatus = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await svc.updateStatus(req.params.requestId, req.body, req.user.id, req.user.role) })
);