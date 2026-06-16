import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const CalendarEvent = sequelize.define("CalendarEvent", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:     { type: DataTypes.STRING, allowNull: false },
  title:       { type: DataTypes.STRING, allowNull: false },
  date:        { type: DataTypes.DATEONLY, allowNull: false },
  type:        {
    type: DataTypes.ENUM("class", "exam", "holiday", "meeting", "personal"),
    defaultValue: "personal",
  },
  description: { type: DataTypes.TEXT, allowNull: true },
  start_time:  { type: DataTypes.STRING, allowNull: true },
  end_time:    { type: DataTypes.STRING, allowNull: true },
  location:    { type: DataTypes.STRING, allowNull: true },
  is_all_day:  { type: DataTypes.BOOLEAN, defaultValue: false },
  source:      { type: DataTypes.ENUM("personal", "cohort", "system"), defaultValue: "personal" },
  cohort_id:   { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "calendar_events",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [{ fields: ["user_id"] }, { fields: ["date"] }, { fields: ["type"] }],
});

export { CalendarEvent };