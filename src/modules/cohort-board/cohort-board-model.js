// src/modules/cohort-board/cohort-board-model.js

import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const CohortPost = sequelize.define(
  "CohortPost",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    cohort_id:     { type: DataTypes.STRING, allowNull: false },
    author_id:     { type: DataTypes.UUID, allowNull: false },
    author_name:   { type: DataTypes.STRING, allowNull: false },
    author_avatar: { type: DataTypes.STRING, allowNull: true },
    title:         { type: DataTypes.STRING, allowNull: false },
    content:       { type: DataTypes.TEXT, allowNull: false },
    type:          { type: DataTypes.STRING, defaultValue: "General" },
    cover:         { type: DataTypes.STRING, allowNull: true },         
    post_for:      { type: DataTypes.STRING, defaultValue: "Everyone" }, 
    likes_count:   { type: DataTypes.INTEGER, defaultValue: 0 },
    comments_count:{ type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: "cohort_posts",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["cohort_id"] },
      { fields: ["author_id"] },
      { fields: ["created_at"] },
    ],
  }
);

const CohortPostLike = sequelize.define(
  "CohortPostLike",
  {
    id:      { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    post_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
  },
  {
    tableName: "cohort_post_likes",
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ["post_id", "user_id"] }],
  }
);

const CohortPostComment = sequelize.define(
  "CohortPostComment",
  {
    id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    post_id:       { type: DataTypes.UUID, allowNull: false },
    author_id:     { type: DataTypes.UUID, allowNull: false },
    author_name:   { type: DataTypes.STRING, allowNull: false },
    author_avatar: { type: DataTypes.STRING, allowNull: true },
    description:   { type: DataTypes.STRING, allowNull: true }, // role/title shown under name
    content:       { type: DataTypes.TEXT, allowNull: false },
    likes_count:   { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: "cohort_post_comments",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["post_id"] }],
  }
);

const CohortPostCommentLike = sequelize.define(
  "CohortPostCommentLike",
  {
    id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    comment_id: { type: DataTypes.UUID, allowNull: false },
    user_id:    { type: DataTypes.UUID, allowNull: false },
  },
  {
    tableName: "cohort_post_comment_likes",
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ["comment_id", "user_id"] }],
  }
);

// ─── Associations ─────────────────────────────────────────────────────────────
CohortPost.hasMany(CohortPostLike,    { foreignKey: "post_id", as: "likes" });
CohortPost.hasMany(CohortPostComment, { foreignKey: "post_id", as: "comments" });
CohortPostComment.hasMany(CohortPostCommentLike, { foreignKey: "comment_id", as: "comment_likes" });

export { CohortPost, CohortPostLike, CohortPostComment, CohortPostCommentLike };