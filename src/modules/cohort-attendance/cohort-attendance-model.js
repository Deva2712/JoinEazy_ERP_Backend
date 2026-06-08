// src/modules/cohort-attendance/cohort-attendance-model.js

import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";


const AttendanceLog = sequelize.define(
  "AttendanceLog",
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
    course_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    professor_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    professor_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY, // "2026-06-06" — no time
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("draft", "final"),
      defaultValue: "final",
    },
  },
  {
    tableName: "attendance_logs",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["cohort_id"] },
      { fields: ["course_id"] },
      { fields: ["professor_id"] },
      { unique: true, fields: ["course_id", "date"] }, // ek course pe ek din mein ek hi log
    ],
  }
);

// ─── AttendanceRecord: har student ka ek log mein present/absent status ───────
const AttendanceRecord = sequelize.define(
  "AttendanceRecord",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    log_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    student_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roll_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_present: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "attendance_records",
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ["log_id", "student_id"] }, // ek student ek log mein ek hi baar
    ],
  }
);

// ─── Associations ─────────────────────────────────────────────────────────────
AttendanceLog.hasMany(AttendanceRecord, {
  foreignKey: "log_id",
  as: "records",
});
AttendanceRecord.belongsTo(AttendanceLog, {
  foreignKey: "log_id",
});

export { AttendanceLog, AttendanceRecord };