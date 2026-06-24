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
  type: { type: DataTypes.ENUM("class","meeting","other","office_hours"), defaultValue: "class" },
}, { tableName: "schedules", timestamps: true });

const MeetingRequest = sequelize.define("MeetingRequest", {
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  professor_id:     { type: DataTypes.UUID, allowNull: false },
  student_id:       { type: DataTypes.UUID, allowNull: false },
  title:            { type: DataTypes.STRING, allowNull: true },
  // FIX: added fields that MeetingCard.jsx needs
  subject:          { type: DataTypes.STRING, allowNull: true },
  participant_name: { type: DataTypes.STRING, allowNull: true },
  participant_role: { type: DataTypes.STRING, defaultValue: "Student" },
  participant_dept: { type: DataTypes.STRING, allowNull: true },
  reason:           { type: DataTypes.TEXT, allowNull: true },
  rejection_reason: { type: DataTypes.TEXT, allowNull: true },
  meeting_type:     { type: DataTypes.STRING, defaultValue: "Online" },
  meeting_link:     { type: DataTypes.STRING, allowNull: true },
  location:         { type: DataTypes.STRING, allowNull: true },
  proposed_time:    { type: DataTypes.DATE, allowNull: true },
  rescheduled_time: { type: DataTypes.DATE, allowNull: true },
  message:          { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM("pending","accepted","rejected","rescheduled"), defaultValue: "pending" },
}, { tableName: "meeting_requests", timestamps: true });

const OutgoingMeetingRequest = sequelize.define("OutgoingMeetingRequest", {
  id:                   { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  professor_id:         { type: DataTypes.UUID, allowNull: false },
  recipient_name:       { type: DataTypes.STRING, allowNull: false },
  recipient_role:       { type: DataTypes.STRING, allowNull: true },
  recipient_department: { type: DataTypes.STRING, allowNull: true },
  subject:              { type: DataTypes.STRING, allowNull: false },
  requested_time:       { type: DataTypes.DATE, allowNull: false },
  reason:               { type: DataTypes.TEXT, allowNull: true },
  mode:                 { type: DataTypes.STRING, allowNull: true },
  link:                 { type: DataTypes.STRING, allowNull: true },
  venue:                { type: DataTypes.STRING, allowNull: true },
  note:                 { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM("pending","accepted","rejected","cancelled"), defaultValue: "pending" },
}, { tableName: "outgoing_meeting_requests", timestamps: true, underscored: true });

export { Schedule, MeetingRequest, OutgoingMeetingRequest };