// src/modules/examination/examination-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

// ── Exam Schedule ─────────────────────────────────────────────────────────────
export const ExamSchedule = sequelize.define("ExamSchedule", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id:  { type: DataTypes.STRING, allowNull: false },
  subject:     { type: DataTypes.STRING, allowNull: false },
  code:        { type: DataTypes.STRING, allowNull: true },
  type:        { type: DataTypes.ENUM("Minor 1", "Minor 2", "End Sem"), allowNull: false },
  date:        { type: DataTypes.DATE, allowNull: false },
  time:        { type: DataTypes.STRING, allowNull: true },   // "10:00 AM - 12:00 PM"
  hall:        { type: DataTypes.STRING, allowNull: true },
  room:        { type: DataTypes.STRING, allowNull: true },
  seat_number: { type: DataTypes.STRING, allowNull: true },
  semester:    { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "exam_schedules",
  timestamps: true,
  underscored: true,
});

// ── Exam Results ──────────────────────────────────────────────────────────────
export const ExamResult = sequelize.define("ExamResult", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id:  { type: DataTypes.STRING, allowNull: false },
  subject:     { type: DataTypes.STRING, allowNull: false },
  code:        { type: DataTypes.STRING, allowNull: true },
  semester:    { type: DataTypes.STRING, allowNull: false },
  midterm1:    { type: DataTypes.FLOAT, allowNull: true },   // out of 25
  midterm2:    { type: DataTypes.FLOAT, allowNull: true },   // out of 25
  end_term:    { type: DataTypes.FLOAT, allowNull: true },   // out of 50
  marks:       { type: DataTypes.FLOAT, allowNull: true },   // total
  max_marks:   { type: DataTypes.INTEGER, defaultValue: 100 },
  grade:       { type: DataTypes.STRING, allowNull: true },  // A+, A, B, etc.
  status:      { type: DataTypes.ENUM("Pass", "Fail", "Withheld", "Pending"), defaultValue: "Pending" },
}, {
  tableName: "exam_results",
  timestamps: true,
  underscored: true,
});

// ── Grade History (semester-wise) ─────────────────────────────────────────────
export const GradeHistory = sequelize.define("GradeHistory", {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id:    { type: DataTypes.STRING, allowNull: false },
  semester:      { type: DataTypes.STRING, allowNull: false },
  sgpa:          { type: DataTypes.FLOAT, allowNull: true },
  cgpa:          { type: DataTypes.FLOAT, allowNull: true },
  total_credits: { type: DataTypes.INTEGER, allowNull: true },
  // subjects JSON array: [{ name, midterm1, midterm2, endTerm, credits, assignments, attendance, grade }]
  subjects:      { type: DataTypes.JSON, defaultValue: [] },
}, {
  tableName: "grade_history",
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ["student_id", "semester"] }],
});

// ── Revaluation Requests ──────────────────────────────────────────────────────
export const RevaluationRequest = sequelize.define("RevaluationRequest", {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id:     { type: DataTypes.STRING, allowNull: false },
  result_id:      { type: DataTypes.UUID, allowNull: true },   // linked ExamResult
  subject:        { type: DataTypes.STRING, allowNull: false },
  subject_code:   { type: DataTypes.STRING, allowNull: true },
  semester:       { type: DataTypes.STRING, allowNull: true },
  reason:         { type: DataTypes.TEXT, allowNull: false },
  priority:       { type: DataTypes.ENUM("High", "Mid", "Low"), defaultValue: "Mid" },
  status:         { type: DataTypes.ENUM("Pending", "UnderReview", "Approved", "Rejected"), defaultValue: "Pending" },
  admin_remarks:  { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "examination_revaluation_requests",
  timestamps: true,
  underscored: true,
});