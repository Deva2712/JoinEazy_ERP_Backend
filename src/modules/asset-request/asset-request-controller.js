// src/modules/asset-request/asset-request-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./asset-request-service.js";

// GET /api/v1/assets/list — returns array directly
export const getAssets = asyncHandler(async (req, res) => {
  const data = await svc.getAssets();
  res.json({ success: true, data });
});

// GET /api/v1/assets/requests — returns { requests, admins }
export const getRequests = asyncHandler(async (req, res) => {
  const data = await svc.getRequests(req.user);
  res.json({ success: true, data });
});

// POST /api/v1/assets/requests
export const createRequest = asyncHandler(async (req, res) => {
  const data = await svc.createRequest(req.body, req.user);
  res.status(201).json({ success: true, data });
});

// PUT /api/v1/assets/requests/:requestId
export const updateRequest = asyncHandler(async (req, res) => {
  const data = await svc.updateRequest(req.params.requestId, req.body, req.user);
  res.json({ success: true, data });
});