// src/modules/mentoring/mentoring-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const MentorSession = sequelize.define("MentorSession", {
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  mentor_id:        { type: DataTypes.UUID, allowNull: false },
  mentee_id:        { type: DataTypes.UUID, allowNull: false },
  title:            { type: DataTypes.STRING, allowNull: false },
  scheduled_at:     { type: DataTypes.DATE,   allowNull: false },
  mode:             { type: DataTypes.ENUM("Offline", "Online"), defaultValue: "Offline" },
  status:           { type: DataTypes.ENUM("pending", "accepted", "completed", "cancelled", "rejected"), defaultValue: "pending" },
  notes:            { type: DataTypes.TEXT,    allowNull: true },
  rejection_reason: { type: DataTypes.TEXT,    allowNull: true },
  meet_link:        { type: DataTypes.STRING,  allowNull: true },
  location:         { type: DataTypes.STRING,  allowNull: true },
  reschedule_date:  { type: DataTypes.DATE,    allowNull: true },
}, { tableName: "mentor_sessions", timestamps: true });

const MentorFeedback = sequelize.define("MentorFeedback", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  session_id: { type: DataTypes.UUID, allowNull: true },
  mentor_id:  { type: DataTypes.UUID, allowNull: false },
  mentee_id:  { type: DataTypes.UUID, allowNull: false },
  rating:     { type: DataTypes.INTEGER, allowNull: false },
  feedback:   { type: DataTypes.TEXT,    allowNull: true },
}, { tableName: "mentor_feedback", timestamps: true });

// ─── MentorAssignment ─────────────────────────────────────────────────────────
// Source of truth for "which professor mentors which student".
// This is INDEPENDENT of mentor_sessions — a student shows up under a
// professor's mentee list as soon as an assignment row exists here, even
// before any meeting has ever been scheduled.
const MentorAssignment = sequelize.define("MentorAssignment", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id:  { type: DataTypes.UUID, allowNull: false },
  mentor_id:   { type: DataTypes.UUID, allowNull: false },
  is_active:   { type: DataTypes.BOOLEAN, defaultValue: true },
  assigned_by: { type: DataTypes.UUID, allowNull: true }, // admin/HOD user id who made the assignment
  assigned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "mentor_assignments",
  timestamps: true,
  indexes: [
    // A student should only have ONE active mentor at a time.
    {
      unique: true,
      fields: ["student_id"],
      where: { is_active: true },
      name: "unique_active_assignment_per_student",
    },
  ],
});

export { MentorSession, MentorFeedback, MentorAssignment };