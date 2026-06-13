import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const Schedule = sequelize.define("Schedule", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  professor_id: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  day: { type: DataTypes.ENUM("Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"), allowNull: false },
  start_time: { type: DataTypes.STRING, allowNull: false },
  end_time: { type: DataTypes.STRING, allowNull: false },
  venue: { type: DataTypes.STRING, allowNull: true },
  cohort_id: { type: DataTypes.STRING, allowNull: true },
  type: { type: DataTypes.ENUM("class","meeting","other"), defaultValue: "class" },
}, { tableName: "schedules", timestamps: true });

const MeetingRequest = sequelize.define("MeetingRequest", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  professor_id: { type: DataTypes.UUID, allowNull: false },
  student_id: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  proposed_time: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.ENUM("pending","accepted","rejected","rescheduled"), defaultValue: "pending" },
  rescheduled_time: { type: DataTypes.DATE, allowNull: true },
  message: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: "meeting_requests", timestamps: true });

export { Schedule, MeetingRequest };