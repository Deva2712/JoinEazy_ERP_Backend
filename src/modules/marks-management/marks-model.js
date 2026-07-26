// src/modules/marks/marks-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

// ─── MarkColumn ─────────────────────────────────────────────────────────────
// One row per column a professor adds to a course's marks sheet
// (e.g. "Mid Sem", "Assignment 1", "End Sem"). The special "Final" column
// is just a MarkColumn with is_final = true; its own marks are never typed
// in directly — they're computed from the weightage of the other columns.
const MarkColumn = sequelize.define("MarkColumn", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  course_id:  { type: DataTypes.STRING, allowNull: false }, // FK -> cohorts.id (Cohort.id is STRING, not UUID)
  name:       { type: DataTypes.STRING, allowNull: false },
  max_marks:  { type: DataTypes.FLOAT, allowNull: true },  // null for the Final column
  weightage:  { type: DataTypes.FLOAT, allowNull: true },  // % this column contributes to Final (set when configuring Final)
  is_final:   { type: DataTypes.BOOLEAN, defaultValue: false },
  credits:    { type: DataTypes.INTEGER, allowNull: true }, // set on the Final column: how many credits this course is worth
  semester:   { type: DataTypes.INTEGER, allowNull: true }, // set on the Final column: which semester this course belongs to
  result_date:{ type: DataTypes.DATEONLY, allowNull: true }, // set on the Final column: when results become visible to students
  position:   { type: DataTypes.INTEGER, defaultValue: 0 }, // display order
}, {
  tableName: "mark_columns",
  timestamps: true,
  indexes: [{ fields: ["course_id"] }],
});

// ─── StudentMark ────────────────────────────────────────────────────────────
// One row per (column, student) — the actual marks entered by the professor.
const StudentMark = sequelize.define("StudentMark", {
  id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  column_id:       { type: DataTypes.UUID, allowNull: false },
  student_id:      { type: DataTypes.STRING, allowNull: false }, // matches CohortParticipant.user_id (STRING)
  marks_obtained:  { type: DataTypes.FLOAT, allowNull: true },
}, {
  tableName: "student_marks",
  timestamps: true,
  indexes: [
    { unique: true, fields: ["column_id", "student_id"] },
    { fields: ["student_id"] },
  ],
});

MarkColumn.hasMany(StudentMark, { foreignKey: "column_id", as: "marks", onDelete: "CASCADE" });
StudentMark.belongsTo(MarkColumn, { foreignKey: "column_id" });

export { MarkColumn, StudentMark };