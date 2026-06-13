// src/modules/bulletins/bulletins-model.js

import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const Bulletin = sequelize.define(
  "Bulletin",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Who posted it
    author_id:   { type: DataTypes.UUID,   allowNull: false },
    author_name: { type: DataTypes.STRING, allowNull: false },

    title:   { type: DataTypes.STRING(500), allowNull: false },
    content: { type: DataTypes.TEXT,        allowNull: false },

    // "institution" | "department" | "course"
    level: {
      type: DataTypes.ENUM("institution", "department", "course"),
      defaultValue: "institution",
    },

    // "Normal" | "High" | "Urgent"
    priority: {
      type: DataTypes.ENUM("Normal", "High", "Urgent"),
      defaultValue: "Normal",
    },

    is_pinned: { type: DataTypes.BOOLEAN, defaultValue: false },

    // For course-level bulletins — matches cohort_id frontend sends as courseId
    cohort_id: { type: DataTypes.STRING, allowNull: true },

    // Department name for department-level bulletins
    department: { type: DataTypes.STRING, allowNull: true },

    // JSON array of { url, name } — stored as TEXT, parsed on read
    attachments: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue("attachments");
        if (!raw) return [];
        try { return JSON.parse(raw); } catch { return []; }
      },
      set(val) {
        this.setDataValue("attachments", val ? JSON.stringify(val) : null);
      },
    },
  },
  {
    tableName: "bulletins",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["level"] },
      { fields: ["priority"] },
      { fields: ["cohort_id"] },
      { fields: ["is_pinned", "created_at"] },
    ],
  }
);

export default Bulletin;