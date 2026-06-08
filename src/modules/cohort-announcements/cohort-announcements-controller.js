// src/modules/cohort-announcements/cohort-announcements-controller.js

import { asyncHandler } from "../../middleware/error.middleware.js";
import * as service from "./cohort-announcements-service.js";

// ─── GET /cohort/:cohortId/announcements ──────────────────────────────────────
export const getAnnouncements = asyncHandler(async (req, res) => {
  const { cohortId } = req.params;
  const requestingUserId = req.user.id;
 
  const includeArchived = req.query.archived === "true";

  const data = await service.getAnnouncements(cohortId, requestingUserId, includeArchived);
  res.status(200).json({ success: true, data });
});

// ─── POST /cohort/:cohortId/announcements ─────────────────────────────────────
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { cohortId } = req.params;
  const author = { id: req.user.id, name: req.user.name, role: req.user.role };

  const data = await service.createAnnouncement(cohortId, req.body, author);
  res.status(201).json({ success: true, data });
});

// ─── PUT /cohort/:cohortId/announcements/:announcementId ──────────────────────
export const updateAnnouncement = asyncHandler(async (req, res) => {
  const { cohortId, announcementId } = req.params;

  const data = await service.updateAnnouncement(
    cohortId,
    announcementId,
    req.body,
    req.user.id
  );
  res.status(200).json({ success: true, data });
});

// ─── DELETE /cohort/:cohortId/announcements/:announcementId ───────────────────
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const { cohortId, announcementId } = req.params;

  await service.deleteAnnouncement(
    cohortId,
    announcementId,
    req.user.id,
    req.user.role
  );
  res.status(200).json({ success: true, message: "Announcement deleted" });
});

// ─── PATCH /cohort/:cohortId/announcements/:announcementId/pin ────────────────
export const togglePin = asyncHandler(async (req, res) => {
  const { cohortId, announcementId } = req.params;
  const { is_pinned } = req.body;

  if (typeof is_pinned !== "boolean") {
    return res.status(400).json({ success: false, message: "is_pinned must be a boolean" });
  }

  const data = await service.togglePin(cohortId, announcementId, is_pinned);
  res.status(200).json({ success: true, data });
});

// ─── PATCH /cohort/:cohortId/announcements/:announcementId/lock ───────────────
export const toggleLock = asyncHandler(async (req, res) => {
  const { cohortId, announcementId } = req.params;
  const { is_locked } = req.body;

  if (typeof is_locked !== "boolean") {
    return res.status(400).json({ success: false, message: "is_locked must be a boolean" });
  }

  const data = await service.toggleLock(cohortId, announcementId, is_locked);
  res.status(200).json({ success: true, data });
});

// ─── PATCH /cohort/:cohortId/announcements/:announcementId/archive ────────────
export const archiveAnnouncement = asyncHandler(async (req, res) => {
  const { cohortId, announcementId } = req.params;

  const data = await service.archiveAnnouncement(cohortId, announcementId);
  res.status(200).json({ success: true, data });
});

// ─── POST /cohort/:cohortId/announcements/:announcementId/replies ─────────────
export const addReply = asyncHandler(async (req, res) => {
  const { cohortId, announcementId } = req.params;
  const author = { id: req.user.id, name: req.user.name, role: req.user.role };

  const data = await service.addReply(cohortId, announcementId, req.body, author);
  res.status(201).json({ success: true, data });
});

// ─── DELETE /cohort/:cohortId/announcements/:announcementId/replies/:replyId ──
export const deleteReply = asyncHandler(async (req, res) => {
  const { cohortId, announcementId, replyId } = req.params;

  await service.deleteReply(
    cohortId,
    announcementId,
    replyId,
    req.user.id,
    req.user.role
  );
  res.status(200).json({ success: true, message: "Reply deleted" });
});

// ─── POST /cohort/:cohortId/announcements/:announcementId/replies/:replyId/upvote
export const toggleUpvoteReply = asyncHandler(async (req, res) => {
  const { cohortId, announcementId, replyId } = req.params;

  const data = await service.toggleUpvoteReply(
    cohortId,
    announcementId,
    replyId,
    req.user.id
  );
  res.status(200).json({ success: true, data });
});