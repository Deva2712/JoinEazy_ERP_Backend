// src/modules/cohort-announcements/cohort-announcements-service.js

import { Op } from "sequelize";
import {
  CohortAnnouncement,
  CohortAnnouncementReply,
  AnnouncementReplyUpvote,
} from "./cohort-announcements-model.js";
// ─── Auto-archive logic ───────────────────────────────────────────────────────

const _lastArchiveRun = new Map(); 
const ARCHIVE_THROTTLE_MS = 60 * 60 * 1000; // 1 hour

export const autoArchiveOldAnnouncements = async (cohortId) => {
  const now = Date.now();
  const last = _lastArchiveRun.get(cohortId) || 0;
  if (now - last < ARCHIVE_THROTTLE_MS) return; 
  _lastArchiveRun.set(cohortId, now);

  const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000);
  await CohortAnnouncement.update(
    { is_archived: true, is_pinned: false },
    {
      where: {
        cohort_id: cohortId,
        is_archived: false,
        is_pinned: false,
        created_at: { [Op.lt]: twoDaysAgo },
      },
    }
  );
};

// ─── GET all announcements for a cohort ──────────────────────────────────────

export const getAnnouncements = async (cohortId, requestingUserId, includeArchived = false) => {
  // Throttled auto-archive — runs at most once/hour, no cron needed
  await autoArchiveOldAnnouncements(cohortId);

  const where = { cohort_id: cohortId };
  if (!includeArchived) where.is_archived = false;

  const announcements = await CohortAnnouncement.findAll({
    where,
    include: [
      {
        model: CohortAnnouncementReply,
        as: "replies",
        include: [
          {
            model: AnnouncementReplyUpvote,
            as: "upvote_records",
            attributes: ["user_id"],
          },
        ],
        order: [["created_at", "ASC"]],
      },
    ],
    order: [
      ["is_pinned", "DESC"],
      ["created_at", "DESC"],
    ],
  });

  // Pure JS transform — no additional DB calls
  return announcements.map((ann) => {
    const a = ann.toJSON();
    a.replies = a.replies.map((reply) => {
      const ids = reply.upvote_records.map((u) => u.user_id);
      return {
        ...reply,
        upvote_records: undefined,          
        upvoted_by_user_ids: ids,
        upvoted_by_current_user: ids.includes(requestingUserId),
        upvotes: ids.length,
      };
    });
    return a;
  });
};

// ─── CREATE announcement ──────────────────────────────────────────────────────
export const createAnnouncement = async (cohortId, data, author) => {
  const announcement = await CohortAnnouncement.create({
    cohort_id: cohortId,
    author_id: author.id,
    author_name: author.name,
    title: data.title,
    content: data.content,
    type: data.type || "announcement",
    is_pinned: data.is_pinned ?? false,
    is_archived: false,
    is_locked: false,
    replies_count: 0,
  });

  return announcement.toJSON();
};

// ─── UPDATE announcement ──────────────────────────────────────────────────────
export const updateAnnouncement = async (cohortId, announcementId, data, authorId) => {
  const announcement = await CohortAnnouncement.findOne({
    where: { id: announcementId, cohort_id: cohortId },
  });

  if (!announcement) {
    const err = new Error("Announcement not found");
    err.statusCode = 404;
    throw err;
  }

  if (announcement.author_id !== authorId) {
    const err = new Error("Not authorized to edit this announcement");
    err.statusCode = 403;
    throw err;
  }

  await announcement.update({
    title: data.title ?? announcement.title,
    content: data.content ?? announcement.content,
    type: data.type ?? announcement.type,
  });

  return announcement.toJSON();
};

// ─── DELETE announcement ──────────────────────────────────────────────────────
export const deleteAnnouncement = async (cohortId, announcementId, authorId, userRole) => {
  const announcement = await CohortAnnouncement.findOne({
    where: { id: announcementId, cohort_id: cohortId },
  });

  if (!announcement) {
    const err = new Error("Announcement not found");
    err.statusCode = 404;
    throw err;
  }

  if (announcement.author_id !== authorId && userRole !== "admin") {
    const err = new Error("Not authorized to delete this announcement");
    err.statusCode = 403;
    throw err;
  }

  await announcement.destroy();
  return { deleted: true };
};

// ─── TOGGLE PIN ───────────────────────────────────────────────────────────────
export const togglePin = async (cohortId, announcementId, isPinned) => {
  const announcement = await CohortAnnouncement.findOne({
    where: { id: announcementId, cohort_id: cohortId },
  });

  if (!announcement) {
    const err = new Error("Announcement not found");
    err.statusCode = 404;
    throw err;
  }

  // Unpin all others when pinning — only one pinned at a time
  if (isPinned) {
    await CohortAnnouncement.update(
      { is_pinned: false },
      { where: { cohort_id: cohortId, id: { [Op.ne]: announcementId } } }
    );
  }

  await announcement.update({ is_pinned: isPinned });
  return announcement.toJSON();
};

// ─── TOGGLE LOCK ──────────────────────────────────────────────────────────────
export const toggleLock = async (cohortId, announcementId, isLocked) => {
  const announcement = await CohortAnnouncement.findOne({
    where: { id: announcementId, cohort_id: cohortId },
  });

  if (!announcement) {
    const err = new Error("Announcement not found");
    err.statusCode = 404;
    throw err;
  }

  await announcement.update({ is_locked: isLocked });
  return announcement.toJSON();
};

// ─── ARCHIVE announcement ─────────────────────────────────────────────────────
export const archiveAnnouncement = async (cohortId, announcementId) => {
  const announcement = await CohortAnnouncement.findOne({
    where: { id: announcementId, cohort_id: cohortId },
  });

  if (!announcement) {
    const err = new Error("Announcement not found");
    err.statusCode = 404;
    throw err;
  }

  await announcement.update({ is_archived: true, is_pinned: false });
  return announcement.toJSON();
};

// ─── ADD REPLY ────────────────────────────────────────────────────────────────
export const addReply = async (cohortId, announcementId, replyData, author) => {
  const announcement = await CohortAnnouncement.findOne({
    where: { id: announcementId, cohort_id: cohortId },
  });

  if (!announcement) {
    const err = new Error("Announcement not found");
    err.statusCode = 404;
    throw err;
  }

  if (announcement.is_locked) {
    const err = new Error("This announcement thread is locked");
    err.statusCode = 403;
    throw err;
  }

  const reply = await CohortAnnouncementReply.create({
    announcement_id: announcementId,
    author_id: author.id,
    author_name: author.name,
    author_role: author.role,
    content: replyData.content,
    upvotes: 0,
  });

  // FIX: Use DB count instead of manual increment — stays accurate always
  const actualCount = await CohortAnnouncementReply.count({
    where: { announcement_id: announcementId },
  });
  await announcement.update({ replies_count: actualCount });

  return {
    ...reply.toJSON(),
    upvoted_by_user_ids: [],
    upvoted_by_current_user: false,
  };
};

// ─── DELETE REPLY ─────────────────────────────────────────────────────────────
export const deleteReply = async (cohortId, announcementId, replyId, userId, userRole) => {
  const announcement = await CohortAnnouncement.findOne({
    where: { id: announcementId, cohort_id: cohortId },
  });

  if (!announcement) {
    const err = new Error("Announcement not found");
    err.statusCode = 404;
    throw err;
  }

  const reply = await CohortAnnouncementReply.findOne({
    where: { id: replyId, announcement_id: announcementId },
  });

  if (!reply) {
    const err = new Error("Reply not found");
    err.statusCode = 404;
    throw err;
  }

  if (reply.author_id !== userId && userRole !== "professor" && userRole !== "admin") {
    const err = new Error("Not authorized to delete this reply");
    err.statusCode = 403;
    throw err;
  }

  await reply.destroy();

  // FIX: Use DB count instead of manual decrement — stays accurate always
  const actualCount = await CohortAnnouncementReply.count({
    where: { announcement_id: announcementId },
  });
  await announcement.update({ replies_count: actualCount });

  return { deleted: true };
};

// ─── UPVOTE / UN-UPVOTE REPLY ─────────────────────────────────────────────────
export const toggleUpvoteReply = async (cohortId, announcementId, replyId, userId) => {
  const announcement = await CohortAnnouncement.findOne({
    where: { id: announcementId, cohort_id: cohortId },
  });

  if (!announcement) {
    const err = new Error("Announcement not found");
    err.statusCode = 404;
    throw err;
  }

  const reply = await CohortAnnouncementReply.findOne({
    where: { id: replyId, announcement_id: announcementId },
    include: [
      {
        model: AnnouncementReplyUpvote,
        as: "upvote_records",
        attributes: ["user_id"],
      },
    ],
  });

  if (!reply) {
    const err = new Error("Reply not found");
    err.statusCode = 404;
    throw err;
  }

  const existingIds = reply.upvote_records.map((u) => u.user_id);
  const alreadyUpvoted = existingIds.includes(userId);

  let updatedIds;
  if (alreadyUpvoted) {
    await AnnouncementReplyUpvote.destroy({ where: { reply_id: replyId, user_id: userId } });
    updatedIds = existingIds.filter((id) => id !== userId);
  } else {
    await AnnouncementReplyUpvote.create({ reply_id: replyId, user_id: userId });
    updatedIds = [...existingIds, userId];
  }

  await reply.update({ upvotes: updatedIds.length });

  return {
    ...reply.toJSON(),
    upvote_records: undefined,
    upvoted_by_user_ids: updatedIds,
    upvoted_by_current_user: !alreadyUpvoted,
    upvotes: updatedIds.length,
  };
};