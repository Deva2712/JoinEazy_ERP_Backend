import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

// ─── CohortCourse (submission/project based — what frontend calls "Courses") ──
const CohortCourse = sequelize.define("CohortCourse", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cohort_id: { type: DataTypes.UUID, allowNull: false },
  created_by: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  deadline: { type: DataTypes.DATE, allowNull: true },
  submission_type: {
    type: DataTypes.ENUM("Individual", "Group"),
    defaultValue: "Individual",
  },
  status: {
    type: DataTypes.ENUM("open", "closed"),
    defaultValue: "open",
  },
  is_graded: { type: DataTypes.BOOLEAN, defaultValue: false },
  max_marks: { type: DataTypes.FLOAT, allowNull: true },
  weightage: { type: DataTypes.FLOAT, allowNull: true },
}, {
  tableName: "cohort_courses",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [{ fields: ["cohort_id"] }],
});

// ─── Attachment (files attached to a course) ───────────────────────────────────
const CourseAttachment = sequelize.define("CourseAttachment", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  course_id: { type: DataTypes.UUID, allowNull: false },
  file_name: { type: DataTypes.STRING, allowNull: false },
  file_url: { type: DataTypes.TEXT, allowNull: true },
  file_size: { type: DataTypes.INTEGER, allowNull: true, comment: "bytes" },
  file_type: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "course_attachments",
  timestamps: false,
  indexes: [{ fields: ["course_id"] }],
});

// ─── CourseSubmission (student/group submission) ──────────────────────────────
const CourseSubmission = sequelize.define("CourseSubmission", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  course_id: { type: DataTypes.UUID, allowNull: false },
  submitted_by: { type: DataTypes.UUID, allowNull: false, comment: "user_id of submitter" },
  group_id: { type: DataTypes.UUID, allowNull: true },
  submission_url: { type: DataTypes.TEXT, allowNull: true },
  submission_note: { type: DataTypes.TEXT, allowNull: true },
  marks_awarded: { type: DataTypes.FLOAT, allowNull: true },
  feedback: { type: DataTypes.TEXT, allowNull: true },
  submitted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "course_submissions",
  timestamps: false,
  indexes: [{ unique: true, fields: ["course_id", "submitted_by"] }, { fields: ["course_id"] }],
});

// ─── CourseComment ────────────────────────────────────────────────────────────
const CourseComment = sequelize.define("CourseComment", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  course_id: { type: DataTypes.UUID, allowNull: false },
  user_id: { type: DataTypes.UUID, allowNull: false },
  user_name: { type: DataTypes.STRING, allowNull: true },
  content: { type: DataTypes.TEXT, allowNull: false },
}, {
  tableName: "course_comments",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
  indexes: [{ fields: ["course_id"] }],
});

// ─── Associations ─────────────────────────────────────────────────────────────
CohortCourse.hasMany(CourseAttachment, { foreignKey: "course_id", as: "attachments", onDelete: "CASCADE" });
CourseAttachment.belongsTo(CohortCourse, { foreignKey: "course_id" });

CohortCourse.hasMany(CourseSubmission, { foreignKey: "course_id", as: "submissions", onDelete: "CASCADE" });
CourseSubmission.belongsTo(CohortCourse, { foreignKey: "course_id" });

CohortCourse.hasMany(CourseComment, { foreignKey: "course_id", as: "comments", onDelete: "CASCADE" });
CourseComment.belongsTo(CohortCourse, { foreignKey: "course_id" });

export { CohortCourse, CourseAttachment, CourseSubmission, CourseComment };
