// src/modules/bulletins/bulletins-controller.js

import { asyncHandler } from "../../middleware/error.middleware.js";
import * as service from "./bulletins-service.js";

// GET /api/v1/bulletins
export const getBulletins = asyncHandler(async (req, res) => {
  const data = await service.getBulletins(req.query);
  res.status(200).json({ success: true, data });
});

// POST /api/v1/bulletins
export const createBulletin = asyncHandler(async (req, res) => {
  const data = await service.createBulletin(
    req.body,
    { id: req.user.id, name: req.user.name },
    req.file || null,
  );
  res.status(201).json({ success: true, data });
});

// DELETE /api/v1/bulletins/:bulletinId
export const deleteBulletin = asyncHandler(async (req, res) => {
  const data = await service.deleteBulletin(
    req.params.bulletinId,
    req.user.id,
    req.user.role,
  );
  res.status(200).json({ success: true, data });
});