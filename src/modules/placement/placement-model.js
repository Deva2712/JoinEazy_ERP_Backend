// src/modules/placement/placement-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

// ── Job Listings (admin/placement cell creates these) ─────────────────────────
export const PlacementJob = sequelize.define("PlacementJob", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  role:        { type: DataTypes.STRING, allowNull: false },
  company:     { type: DataTypes.STRING, allowNull: false },
  location:    { type: DataTypes.STRING, allowNull: true },
  type:        { type: DataTypes.ENUM("Internship", "Full Time"), allowNull: false, defaultValue: "Full Time" },
  package:     { type: DataTypes.STRING, allowNull: true },   // "₹12 LPA" ya "₹25k/month"
  stipend:     { type: DataTypes.STRING, allowNull: true },   // internship ke liye
  description: { type: DataTypes.TEXT,   allowNull: true },
  requirements:{ type: DataTypes.JSON,   allowNull: true, defaultValue: [] }, // ["B.Tech CS", "CGPA >= 7"]
  rounds:      { type: DataTypes.JSON,   allowNull: true, defaultValue: [] }, // ["Aptitude", "Technical", "HR"]
  deadline:    { type: DataTypes.DATE,   allowNull: true },
  is_active:   { type: DataTypes.BOOLEAN, defaultValue: true },
  created_by:  { type: DataTypes.STRING, allowNull: true },   // admin user id
}, {
  tableName: "placement_jobs",
  timestamps: true,
  underscored: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

// ── Student Applications ──────────────────────────────────────────────────────
export const PlacementApplication = sequelize.define("PlacementApplication", {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id:   { type: DataTypes.STRING, allowNull: false },
  job_id:       { type: DataTypes.UUID,   allowNull: false },

  // Form fields from Useplacementapply.js
  full_name:    { type: DataTypes.STRING, allowNull: false },
  email:        { type: DataTypes.STRING, allowNull: false },
  phone:        { type: DataTypes.STRING, allowNull: true },
  roll_number:  { type: DataTypes.STRING, allowNull: true },
  branch:       { type: DataTypes.STRING, allowNull: true },
  year:         { type: DataTypes.STRING, allowNull: true },
  cgpa:         { type: DataTypes.STRING, allowNull: true },
  why_company:  { type: DataTypes.TEXT,   allowNull: true },
  strengths:    { type: DataTypes.TEXT,   allowNull: true },
  experience:   { type: DataTypes.TEXT,   allowNull: true },
  availability: { type: DataTypes.STRING, allowNull: true },
  linked_in:    { type: DataTypes.STRING, allowNull: true },
  portfolio:    { type: DataTypes.STRING, allowNull: true },
  cover_letter: { type: DataTypes.TEXT,   allowNull: true },
  resume_url:   { type: DataTypes.STRING(1000), allowNull: true },  // S3 URL
  notes:        { type: DataTypes.TEXT,   allowNull: true },

  // Status lifecycle: Applied → Shortlisted → Selected / Rejected
  status:       { type: DataTypes.ENUM("Applied", "Shortlisted", "Rejected", "Selected"),
                  defaultValue: "Applied", allowNull: false },

  // Interview details (filled by placement cell after shortlisting)
  interview_date: { type: DataTypes.DATE,   allowNull: true },
  interview_time: { type: DataTypes.STRING, allowNull: true },
  interview_mode: { type: DataTypes.ENUM("Online", "In-Person", "Hybrid"), allowNull: true },
  online_link:    { type: DataTypes.STRING(1000), allowNull: true },
  venue:          { type: DataTypes.STRING, allowNull: true },
  guidelines:     { type: DataTypes.JSON,   allowNull: true, defaultValue: [] },
  documents_required: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
}, {
  tableName: "placement_applications",
  timestamps: true,
  underscored: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [
    { unique: true, fields: ["student_id", "job_id"] }, // ek student ek job mein sirf ek baar apply kar sakta hai
  ],
});

// ── Student Documents (resume + portfolio) ────────────────────────────────────
export const PlacementDocument = sequelize.define("PlacementDocument", {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id:    { type: DataTypes.STRING, allowNull: false, unique: true },
  resume_url:    { type: DataTypes.STRING(1000), allowNull: true },
  resume_name:   { type: DataTypes.STRING, allowNull: true },
  portfolio_url: { type: DataTypes.STRING(1000), allowNull: true },
  portfolio_name:{ type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "placement_documents",
  timestamps: true,
  underscored: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

// ── Self-reported Placement History ──────────────────────────────────────────
export const PlacementHistory = sequelize.define("PlacementHistory", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: { type: DataTypes.STRING, allowNull: false },
  role:       { type: DataTypes.STRING, allowNull: false },
  company:    { type: DataTypes.STRING, allowNull: false },
  year:       { type: DataTypes.STRING, allowNull: true },
  package:    { type: DataTypes.STRING, allowNull: true },
  type:       { type: DataTypes.ENUM("Full Time", "Internship"), defaultValue: "Full Time" },
  notes:      { type: DataTypes.TEXT,   allowNull: true },
}, {
  tableName: "placement_history",
  timestamps: true,
  underscored: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

// ── Associations ──────────────────────────────────────────────────────────────
PlacementJob.hasMany(PlacementApplication,  { foreignKey: "job_id", as: "applications" });
PlacementApplication.belongsTo(PlacementJob, { foreignKey: "job_id", as: "job" });