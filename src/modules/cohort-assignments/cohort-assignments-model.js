// src/modules/cohort-assignments/cohort-assignments-model.js

import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

// ─── Assignment ───────────────────────────────────────────────────────────────
const CohortAssignment = sequelize.define(
  "CohortAssignment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cohort_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    author_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("individual", "group"),
      defaultValue: "individual",
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    marks: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    submission_link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "cohort_assignments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["cohort_id"] },
      { fields: ["cohort_id", "type"] },
    ],
  }
);

// ─── Assignment Submission ────────────────────────────────────────────────────
const AssignmentSubmission = sequelize.define(
  "AssignmentSubmission",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    assignment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "cohort_assignments", key: "id" },
      onDelete: "CASCADE",
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    student_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    group_leader_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    submitted_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    marks_awarded: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    grade_comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "assignment_submissions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["assignment_id"] },
      { unique: true, fields: ["assignment_id", "student_id"] },
    ],
  }
);

// ─── Associations ─────────────────────────────────────────────────────────────
CohortAssignment.hasMany(AssignmentSubmission, {
  foreignKey: "assignment_id",
  as: "submissions",
  onDelete: "CASCADE",
});
AssignmentSubmission.belongsTo(CohortAssignment, {
  foreignKey: "assignment_id",
});

export { CohortAssignment, AssignmentSubmission };
