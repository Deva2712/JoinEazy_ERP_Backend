// src/modules/cohort-meetings/cohort-meetings-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const CohortMeeting = sequelize.define("CohortMeeting", {
  id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cohort_id:       { type: DataTypes.UUID, allowNull: false },
  created_by:      { type: DataTypes.UUID, allowNull: false },
  created_by_name: { type: DataTypes.STRING, allowNull: false },
  student_id:      { type: DataTypes.UUID, allowNull: true },
  professor_id:    { type: DataTypes.UUID, allowNull: true },
  professor_name:  { type: DataTypes.STRING, allowNull: true },
  title:           { type: DataTypes.STRING, allowNull: false },
  description:     { type: DataTypes.TEXT, allowNull: true },
  meeting_url:     { type: DataTypes.STRING, allowNull: true },
  platform:        { type: DataTypes.STRING, defaultValue: "zoom" },
  scheduled_at:    { type: DataTypes.DATE, allowNull: true },  // null allowed — student request mein date optional
  duration_mins:   { type: DataTypes.INTEGER, defaultValue: 60 },
  status: {
    type: DataTypes.ENUM("scheduled", "ongoing", "completed", "cancelled", "pending", "accepted", "rejected"),
    defaultValue: "scheduled",
  },
}, {
  tableName: "cohort_meetings",
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ["cohort_id"] },
    { fields: ["scheduled_at"] },
    { fields: ["student_id"] },
    { fields: ["professor_id"] },
  ],
});

export default CohortMeeting;