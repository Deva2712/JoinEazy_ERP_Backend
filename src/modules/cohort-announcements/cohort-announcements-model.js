// src/modules/cohort-announcements/cohort-announcements-model.js

import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

// ─── Announcement ─────────────────────────────────────────────────────────────
const CohortAnnouncement = sequelize.define(
  "CohortAnnouncement",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cohort_id: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "ID of the cohort this announcement belongs to",
    },
    author_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "User ID of the professor/staff who created the announcement",
    },
    author_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("announcement", "update", "reminder", "urgent"),
      defaultValue: "announcement",
    },
    is_pinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_archived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_locked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "When locked, students cannot add replies",
    },
    replies_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "cohort_announcements",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    // ── Indexes: fast filtering by cohort, archive status, pinned ──
    indexes: [
      { fields: ["cohort_id"] },
      { fields: ["cohort_id", "is_archived"] },
      { fields: ["cohort_id", "is_pinned"] },
    ],
  }
);

// ─── Announcement Reply ───────────────────────────────────────────────────────
const CohortAnnouncementReply = sequelize.define(
  "CohortAnnouncementReply",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    announcement_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "cohort_announcements", key: "id" },
      onDelete: "CASCADE",
    },
    author_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    author_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    author_role: {
      type: DataTypes.ENUM("student", "professor", "staff", "admin"),
      defaultValue: "student",
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    upvotes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "cohort_announcement_replies",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    // ── Indexes: fast lookup by announcement + sorted by date ──
    indexes: [
      { fields: ["announcement_id"] },
      { fields: ["announcement_id", "created_at"] },
    ],
  }
);

// ─── Reply Upvotes (junction table) ──────────────────────────────────────────
const AnnouncementReplyUpvote = sequelize.define(
  "AnnouncementReplyUpvote",
  {
    reply_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "cohort_announcement_replies", key: "id" },
      onDelete: "CASCADE",
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "announcement_reply_upvotes",
    timestamps: false,
    indexes: [
      // Unique: one user can upvote a reply only once
      { unique: true, fields: ["reply_id", "user_id"] },
      // Fast lookup: all upvotes for a reply
      { fields: ["reply_id"] },
    ],
  }
);

// ─── Associations ─────────────────────────────────────────────────────────────
CohortAnnouncement.hasMany(CohortAnnouncementReply, {
  foreignKey: "announcement_id",
  as: "replies",
  onDelete: "CASCADE",
});
CohortAnnouncementReply.belongsTo(CohortAnnouncement, {
  foreignKey: "announcement_id",
});
CohortAnnouncementReply.hasMany(AnnouncementReplyUpvote, {
  foreignKey: "reply_id",
  as: "upvote_records",
  onDelete: "CASCADE",
});

export { CohortAnnouncement, CohortAnnouncementReply, AnnouncementReplyUpvote };