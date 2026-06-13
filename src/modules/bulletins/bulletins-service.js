// src/modules/bulletins/bulletins-service.js

import { Op } from "sequelize";
import Bulletin from "./bulletins-model.js";

// ─── Helper: shape bulletin for frontend ─────────────────────────────────────
const transform = (b) => {
  const json = b.toJSON ? b.toJSON() : b;
  return {
    id:          json.id,
    title:       json.title,
    content:     json.content,
    level:       json.level,
    priority:    json.priority,
    is_pinned:   json.is_pinned,
    cohortId:    json.cohort_id || null,
    cohort_id:   json.cohort_id || null,
    department:  json.department || null,
    author:      json.author_name,
    author_id:   json.author_id,
    attachments: json.attachments || [],  
    createdAt:   json.created_at,
    created_at:  json.created_at,
  };
};

// ─── GET bulletins (with optional filters) ───────────────────────────────────
export const getBulletins = async (query = {}) => {
  const where = {};

  if (query.level     && query.level !== "all")     where.level    = query.level;
  if (query.priority  && query.priority !== "all")  where.priority = query.priority;
  if (query.cohort_id)                              where.cohort_id = query.cohort_id;
  if (query.department)                             where.department = query.department;

  const bulletins = await Bulletin.findAll({
    where,
    order: [
      ["is_pinned", "DESC"],
      ["created_at", "DESC"],
    ],
  });

  return bulletins.map(transform);
};

// ─── CREATE bulletin ──────────────────────────────────────────────────────────
export const createBulletin = async (data, author) => {
  // attachment from frontend is a single file object { name, url }
  // We store it as an array for consistency with the frontend shape
  let attachments = [];
  if (data.attachment) {
    attachments = [{ name: data.attachment.name || "Attachment", url: data.attachment.url || "" }];
  }
  if (data.attachments && Array.isArray(data.attachments)) {
    attachments = data.attachments;
  }

  const bulletin = await Bulletin.create({
    author_id:   author.id,
    author_name: author.name,
    title:       data.title.trim(),
    content:     data.content.trim(),
    level:       data.level       || "institution",
    priority:    data.priority    || "Normal",
    is_pinned:   data.is_pinned   || false,
    cohort_id:   data.courseId    || data.cohortId || data.cohort_id || null,
    department:  data.department  || null,
    attachments,
  });

  return transform(bulletin);
};

// ─── DELETE bulletin ──────────────────────────────────────────────────────────
export const deleteBulletin = async (bulletinId, userId, userRole) => {
  const bulletin = await Bulletin.findByPk(bulletinId);
  if (!bulletin) {
    const e = new Error("Bulletin not found");
    e.statusCode = 404;
    throw e;
  }

  // Only author or admin can delete
  if (bulletin.author_id !== userId && userRole !== "admin" && userRole !== "professor") {
    const e = new Error("Not authorized to delete this bulletin");
    e.statusCode = 403;
    throw e;
  }

  await bulletin.destroy();
  return { deleted: true };
};