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

export { MentorSession, MentorFeedback };