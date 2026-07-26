import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

// Catalog of courses students can register for in a given window
// (registrar/admin managed; students only ever read this list).
const AvailableCourse = sequelize.define("AvailableCourse", {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  course_code:   { type: DataTypes.STRING, allowNull: false },
  title:         { type: DataTypes.STRING, allowNull: false },
  instructor:    { type: DataTypes.STRING, allowNull: true },
  credits:       { type: DataTypes.INTEGER, defaultValue: 3 },
  overview:      { type: DataTypes.TEXT, allowNull: true },
  is_elective:   { type: DataTypes.BOOLEAN, defaultValue: false },
  is_compulsory: { type: DataTypes.BOOLEAN, defaultValue: false },
  semester:        { type: DataTypes.STRING, allowNull: true },
  academic_year:   { type: DataTypes.STRING, allowNull: true },
  // Seat allocation: capacity = total seats (null = unlimited, no allocation run needed).
  // department = null means open to every department in the target semester; set it to
  // restrict the elective to one department's pool during allocation (e.g. "CSE").
  capacity:      { type: DataTypes.INTEGER, allowNull: true },
  department:    { type: DataTypes.STRING, allowNull: true },
}, { tableName: "available_courses", timestamps: true });

// Single-row config controlling whether the registration window is open —
// a registrar/admin feature edits this; students only read it.
const RegistrationWindow = sequelize.define("RegistrationWindow", {
  id:                   { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
  is_open:              { type: DataTypes.BOOLEAN, defaultValue: false },
  window_end:           { type: DataTypes.DATE, allowNull: true },
  next_window_date:     { type: DataTypes.DATE, allowNull: true },
  max_electives:        { type: DataTypes.INTEGER, defaultValue: 5 },
  target_semester:      { type: DataTypes.STRING, allowNull: true },
  target_academic_year: { type: DataTypes.STRING, allowNull: true },
  // Flips to true once the registrar runs the CGPA-based allocation on the final date —
  // Approved/Rejected results only mean anything to students after this is true.
  results_published:    { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: "registration_window", timestamps: true });

const CourseRegistration = sequelize.define("CourseRegistration", {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id:    { type: DataTypes.UUID, allowNull: false },
  course_id:     { type: DataTypes.UUID, allowNull: false },
  is_elective:   { type: DataTypes.BOOLEAN, defaultValue: false },
  is_compulsory: { type: DataTypes.BOOLEAN, defaultValue: false },
  priority:      { type: DataTypes.INTEGER, allowNull: true }, // 1st/2nd/3rd choice for electives
  status:        { type: DataTypes.ENUM("Pending", "Approved", "Rejected", "Swapped"), defaultValue: "Pending" },
  admin_remarks: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: "course_registrations", timestamps: true });

// One-time academic details a student enters on the Registration tab (department,
// semester, CGPA) — locked after first save. The allocation algorithm needs these to
// determine eligibility (department-restricted electives) and merit order (CGPA rank).
const StudentRegProfile = sequelize.define("StudentRegProfile", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: { type: DataTypes.UUID, allowNull: false, unique: true },
  department: { type: DataTypes.STRING, allowNull: false },
  semester:   { type: DataTypes.STRING, allowNull: false },
  cgpa:       { type: DataTypes.DECIMAL(4, 2), allowNull: false },
  locked:     { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: "student_reg_profiles", timestamps: true });

const CourseFeedback = sequelize.define("CourseFeedback", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: { type: DataTypes.UUID, allowNull: false },
  cohort_id:  { type: DataTypes.STRING, allowNull: false },
  ratings:    { type: DataTypes.JSON, defaultValue: {} },
  comment:    { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "course_feedback",
  timestamps: true,
  indexes: [{ unique: true, fields: ["student_id", "cohort_id"] }],
});

export { AvailableCourse, RegistrationWindow, CourseRegistration, CourseFeedback, StudentRegProfile };