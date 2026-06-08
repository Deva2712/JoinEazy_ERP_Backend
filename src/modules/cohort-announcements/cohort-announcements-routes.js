// src/modules/cohort-announcements/cohort-announcements-routes.js

import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import * as controller from "./cohort-announcements-controller.js";

const router = express.Router({ mergeParams: true });


// ─── All routes require authentication ───────────────────────────────────────
router.use(protect);

// ─── Announcements CRUD ───────────────────────────────────────────────────────
// GET    /api/v1/cohort/:cohortId/announcements
router.get("/", controller.getAnnouncements);

// POST   /api/v1/cohort/:cohortId/announcements  (professor/admin only)
router.post(
  "/",
  authorize("professor", "admin"),
  controller.createAnnouncement
);

// PUT    /api/v1/cohort/:cohortId/announcements/:announcementId
router.put(
  "/:announcementId",
  authorize("professor", "admin"),
  controller.updateAnnouncement
);

// DELETE /api/v1/cohort/:cohortId/announcements/:announcementId
router.delete(
  "/:announcementId",
  authorize("professor", "admin"),
  controller.deleteAnnouncement
);

// ─── Pin / Lock / Archive ─────────────────────────────────────────────────────
// PATCH  /api/v1/cohort/:cohortId/announcements/:announcementId/pin
router.patch(
  "/:announcementId/pin",
  authorize("professor", "admin"),
  controller.togglePin
);

// PATCH  /api/v1/cohort/:cohortId/announcements/:announcementId/lock
router.patch(
  "/:announcementId/lock",
  authorize("professor", "admin"),
  controller.toggleLock
);

// PATCH  /api/v1/cohort/:cohortId/announcements/:announcementId/archive
router.patch(
  "/:announcementId/archive",
  authorize("professor", "admin"),
  controller.archiveAnnouncement
);

// ─── Replies ──────────────────────────────────────────────────────────────────
// POST   /api/v1/cohort/:cohortId/announcements/:announcementId/replies
router.post("/:announcementId/replies", controller.addReply);

// DELETE /api/v1/cohort/:cohortId/announcements/:announcementId/replies/:replyId
router.delete("/:announcementId/replies/:replyId", controller.deleteReply);

// POST   /api/v1/cohort/:cohortId/announcements/:announcementId/replies/:replyId/upvote
router.post(
  "/:announcementId/replies/:replyId/upvote",
  controller.toggleUpvoteReply
);

export default router;