// src/modules/profmentoring/profmentoring-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

// Reuse mentor_sessions table but with extra columns
const ProfMentoringSession = sequelize.define("ProfMentoringSession", {
  id:                  { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  mentor_id:           { type: DataTypes.UUID, allowNull: false },
  mentee_id:           { type: DataTypes.UUID, allowNull: false },
  title:               { type: DataTypes.STRING, allowNull: false },
  scheduled_at:        { type: DataTypes.DATE,   allowNull: false },
  mode:                { type: DataTypes.ENUM("Offline", "Online"), defaultValue: "Offline" },
  status:              { type: DataTypes.ENUM("pending","accepted","completed","cancelled","rejected"), defaultValue: "pending" },
  notes:               { type: DataTypes.TEXT,   allowNull: true },
  meet_link:           { type: DataTypes.STRING, allowNull: true },
  location:            { type: DataTypes.STRING, allowNull: true },
  reschedule_date:     { type: DataTypes.DATE,   allowNull: true },
  rejection_reason:    { type: DataTypes.TEXT,   allowNull: true },
  has_attended:        { type: DataTypes.BOOLEAN, allowNull: true },  // null=unmarked

  // Prof fills after meeting
  discussion_summary:  { type: DataTypes.TEXT, allowNull: true },
  action_plan:         { type: DataTypes.JSON, allowNull: true },
  performance_ratings: { type: DataTypes.JSON, allowNull: true },
  overall_remarks:     { type: DataTypes.TEXT, allowNull: true },
}, { tableName: "mentor_sessions", timestamps: true });

export { ProfMentoringSession };