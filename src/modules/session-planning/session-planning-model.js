import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const SessionSchedule = sequelize.define("SessionSchedule", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  professor_id: { type: DataTypes.UUID, allowNull: false },
  cohort_id: { type: DataTypes.STRING, allowNull: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  scheduled_at: { type: DataTypes.DATE, allowNull: false },
  duration_mins: { type: DataTypes.INTEGER, defaultValue: 60 },
  status: { type: DataTypes.ENUM("scheduled","completed","cancelled"), defaultValue: "scheduled" },
}, { tableName: "session_schedules", timestamps: true });

const SessionReflection = sequelize.define("SessionReflection", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  session_id: { type: DataTypes.UUID, allowNull: false },
  professor_id: { type: DataTypes.UUID, allowNull: false },
  reflection: { type: DataTypes.TEXT, allowNull: false },
}, { tableName: "session_reflections", timestamps: true });

const SessionDocument = sequelize.define("SessionDocument", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  course_id: { type: DataTypes.STRING, allowNull: false },
  professor_id: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: true },
  type: { type: DataTypes.STRING, defaultValue: "document" },
}, { tableName: "session_documents", timestamps: true });

export { SessionSchedule, SessionReflection, SessionDocument };