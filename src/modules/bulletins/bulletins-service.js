// src/modules/bulletins/bulletins-service.js

import { Op } from "sequelize";
import Bulletin from "./bulletins-model.js";
import { Cohort } from "../cohort/cohort-model.js";
import { uploadToS3 } from "../../middleware/upload.middleware.js";

// ─── Helper: shape bulletin for frontend ─────────────────────────────────────
const transform = async (b) => {
  const json = b.toJSON ? b.toJSON() : b;

  let courseName = null;
  if (json.cohort_id) {
    const cohort = await Cohort.findByPk(json.cohort_id);
    courseName = cohort?.cohort_name || null;
  }

  return {
    id:          json.id,
    title:       json.title,
    content:     json.content,
    level:       json.level,
    priority:    json.priority,
    is_pinned:   json.is_pinned,
    cohortId:    json.cohort_id || null,
    cohort_id:   json.cohort_id || null,
    courseName,
    department:  json.department || null,
    author:      json.author_name,
    author_id:   json.author_id,
    attachments: json.attachments || [],
    createdAt:   json.createdAt || json.created_at,
    created_at:  json.createdAt || json.created_at,
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

  return Promise.all(bulletins.map(transform));
};

// ─── CREATE bulletin ──────────────────────────────────────────────────────────
export const createBulletin = async (data, author, file = null) => {
  let attachments = [];

  // Agar file upload aayi — S3 pe bhejo
  if (file) {
    const { url } = await uploadToS3(file, "bulletins");
    attachments = [{ name: file.originalname || "Attachment", url }];
  } else if (data.attachment && data.attachment.url) {
    attachments = [{ name: data.attachment.name || "Attachment", url: data.attachment.url }];
  } else if (data.attachments && Array.isArray(data.attachments)) {
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

  const fresh = await Bulletin.findByPk(bulletin.id);
  return transform(fresh);
};

// ─── DELETE bulletin ──────────────────────────────────────────────────────────
export const deleteBulletin = async (bulletinId, userId, userRole) => {
  const bulletin = await Bulletin.findByPk(bulletinId);
  if (!bulletin) {
    const e = new Error("Bulletin not found");
    e.statusCode = 404;
    throw e;
  }

  if (bulletin.author_id !== userId && userRole !== "admin" && userRole !== "professor") {
    const e = new Error("Not authorized to delete this bulletin");
    e.statusCode = 403;
    throw e;
  }

  await bulletin.destroy();
  return { deleted: true };
};