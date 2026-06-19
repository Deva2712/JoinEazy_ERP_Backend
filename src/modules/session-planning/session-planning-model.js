// src/modules/session-planning/session-planning-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

// A course section taught by a professor (e.g. "Data Structures — Sec A")
const CourseSection = sequelize.define("CourseSection", {
  id:            { type: DataTypes.STRING, primaryKey: true },   // e.g. "SEC001"
  professor_id:  { type: DataTypes.STRING, allowNull: false },
  course_name:   { type: DataTypes.STRING, allowNull: false },
  course_codes:  { type: DataTypes.JSON, defaultValue: [] },
  course_type:   { type: DataTypes.STRING, defaultValue: "Theory" },  // Theory, Lab
  start_date:    { type: DataTypes.DATEONLY, allowNull: true },
  end_date:      { type: DataTypes.DATEONLY, allowNull: true },
  status:        { type: DataTypes.ENUM("Ongoing","Completed","Upcoming"), defaultValue: "Ongoing" },
}, {
  tableName: "course_sections",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["professor_id"] }],
});

// Weekly recurring slots for a section
const ScheduleSlot = sequelize.define("ScheduleSlot", {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  section_id:    { type: DataTypes.STRING, allowNull: false },
  day:           { type: DataTypes.STRING, allowNull: false },     // Monday, Tuesday...
  start_time:    { type: DataTypes.STRING, allowNull: false },     // "9:00 AM"
  end_time:      { type: DataTypes.STRING, allowNull: false },
  course_code:   { type: DataTypes.STRING, allowNull: true },
  room_number:   { type: DataTypes.STRING, allowNull: true },
  building_name: { type: DataTypes.STRING, allowNull: true },
  batch_section: { type: DataTypes.STRING, allowNull: true },
  branch:        { type: DataTypes.STRING, allowNull: true },
  semester:      { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: "schedule_slots",
  timestamps: false,
  underscored: true,
  indexes: [{ fields: ["section_id"] }],
});

// Teacher reflections per session
const SessionReflection = sequelize.define("SessionReflection", {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  professor_id:  { type: DataTypes.STRING, allowNull: false },
  section_id:    { type: DataTypes.STRING, allowNull: false },
  date:          { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  topics_covered:{ type: DataTypes.TEXT, allowNull: true },
  challenges:    { type: DataTypes.TEXT, allowNull: true },
  next_steps:    { type: DataTypes.TEXT, allowNull: true },
  status:        { type: DataTypes.STRING, defaultValue: "Submitted" },
}, {
  tableName: "session_reflections",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["professor_id"] }, { fields: ["section_id"] }],
});

// Documents uploaded per course section, keyed by doc type
const SectionDocument = sequelize.define("SectionDocument", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  section_id:  { type: DataTypes.STRING, allowNull: false },
  doc_type:    { type: DataTypes.STRING, allowNull: false },   // Syllabus, LessonPlan, etc.
  file_name:   { type: DataTypes.STRING, allowNull: true },
  url:         { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "section_documents",
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ["section_id", "doc_type"] }],
});

CourseSection.hasMany(ScheduleSlot, { foreignKey: "section_id", as: "schedule", onDelete: "CASCADE" });

export { CourseSection, ScheduleSlot, SessionReflection, SectionDocument };