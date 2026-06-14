import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./student-profile-service.js";

export const getProfile      = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getProfile(req.user.id) }));
export const updateProfile   = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.updateProfile(req.user.id, req.body) }));
export const updatePortfolio = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.updatePortfolio(req.user.id, req.body) }));

export const uploadDocument  = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  const data = await svc.addDocument(req.user.id, req.body.docType, req.file);
  res.status(201).json({ success: true, data });
});

export const getDocuments    = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getDocuments(req.user.id) }));
