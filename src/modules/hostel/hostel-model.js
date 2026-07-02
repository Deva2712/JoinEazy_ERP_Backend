// src/modules/hostel/hostel-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

// ─── Room Allotment ───────────────────────────────────────────────────────────
const HostelRoomAllotment = sequelize.define("HostelRoomAllotment", {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id:    { type: DataTypes.UUID, allowNull: false, unique: true },
  block:         { type: DataTypes.STRING, allowNull: true },
  room_number:   { type: DataTypes.STRING, allowNull: true },
  type:          { type: DataTypes.STRING, allowNull: true },          
  floor_number:  { type: DataTypes.STRING, allowNull: true },
  allotted_from: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: "hostel_room_allotments",
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ["student_id"] }],
});

// ─── Leave Requests ───────────────────────────────────────────────────────────
const HostelLeaveRequest = sequelize.define("HostelLeaveRequest", {
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id:       { type: DataTypes.UUID, allowNull: false },
  from_date:        { type: DataTypes.DATEONLY, allowNull: true },
  from_time:        { type: DataTypes.STRING, allowNull: true },
  to_date:          { type: DataTypes.DATEONLY, allowNull: true },
  to_time:          { type: DataTypes.STRING, allowNull: true },
  reason:           { type: DataTypes.TEXT, allowNull: true },
  parent_contact:   { type: DataTypes.STRING, allowNull: true },
  status:           { type: DataTypes.ENUM("Pending", "Approved", "Rejected"), defaultValue: "Pending" },
  rejection_reason: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "hostel_leave_requests",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["student_id"] }],
});

// ─── Outing Requests ──────────────────────────────────────────────────────────
const HostelOutingRequest = sequelize.define("HostelOutingRequest", {
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id:       { type: DataTypes.UUID, allowNull: false },
  date:             { type: DataTypes.DATEONLY, allowNull: true },
  out_time:         { type: DataTypes.STRING, allowNull: true },
  return_time:      { type: DataTypes.STRING, allowNull: true },
  purpose:          { type: DataTypes.TEXT, allowNull: true },
  parent_contact:   { type: DataTypes.STRING, allowNull: true },
  status:           { type: DataTypes.ENUM("Pending", "Approved", "Rejected"), defaultValue: "Pending" },
  current_step:     { type: DataTypes.INTEGER, defaultValue: 0 }, // 0 Submitted,1 Parent call,2 Warden review,3 Decision
  rejection_reason: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "hostel_outing_requests",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["student_id"] }],
});

// ─── Maintenance Requests ─────────────────────────────────────────────────────
const HostelMaintenanceRequest = sequelize.define("HostelMaintenanceRequest", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id:  { type: DataTypes.UUID, allowNull: false },
  category:    { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  priority:    { type: DataTypes.ENUM("Low", "Medium", "High"), defaultValue: "Medium" },
  status:      { type: DataTypes.ENUM("Pending", "In Progress", "Resolved", "Rejected"), defaultValue: "Pending" },
  steps:       { type: DataTypes.JSON, defaultValue: [] }, 
}, {
  tableName: "hostel_maintenance_requests",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["student_id"] }],
});

// ─── Complaints ───────────────────────────────────────────────────────────────
const HostelComplaint = sequelize.define("HostelComplaint", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id:  { type: DataTypes.UUID, allowNull: false },
  subject:     { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  against:     { type: DataTypes.STRING, allowNull: true },
  status:      { type: DataTypes.ENUM("Pending", "Open", "In Progress", "Resolved"), defaultValue: "Pending" },
}, {
  tableName: "hostel_complaints",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["student_id"] }],
});

export {
  HostelRoomAllotment,
  HostelLeaveRequest,
  HostelOutingRequest,
  HostelMaintenanceRequest,
  HostelComplaint,
};