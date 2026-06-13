import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const StudentAttendance = sequelize.define("StudentAttendance", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: { type: DataTypes.UUID, allowNull: false },
  cohort_id: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM("present","absent","late"), defaultValue: "present" },
  qr_code: { type: DataTypes.STRING, allowNull: true },
}, { tableName: "student_attendance", timestamps: true });

const StudentTask = sequelize.define("StudentTask", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  due_date: { type: DataTypes.DATEONLY, allowNull: true },
  is_completed: { type: DataTypes.BOOLEAN, defaultValue: false },
  type: { type: DataTypes.STRING, defaultValue: "task" },
}, { tableName: "student_tasks", timestamps: true });

export { StudentAttendance, StudentTask };