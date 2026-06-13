// src/modules/research/research-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const Research = sequelize.define("Research", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  created_by:  { type: DataTypes.STRING, allowNull: false }, // FIX: STRING not UUID
  title:       { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  type:        { type: DataTypes.STRING, defaultValue: "research" }, // research, publication
  status:      { type: DataTypes.ENUM("open", "active", "completed", "on_hold"), defaultValue: "open" },
  start_date:  { type: DataTypes.DATEONLY, allowNull: true },
  end_date:    { type: DataTypes.DATEONLY, allowNull: true },
  timeline:    { type: DataTypes.JSON, defaultValue: [] },
  is_starred:  { type: DataTypes.BOOLEAN, defaultValue: false },
  tags:        { type: DataTypes.JSON, defaultValue: [] },
  collaborators: { type: DataTypes.JSON, defaultValue: [] },
}, {
  tableName: "research_projects",
  timestamps: true,
  underscored: true,
});

const ResearchRole = sequelize.define("ResearchRole", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  research_id: { type: DataTypes.UUID, allowNull: false },
  title:       { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  vacancies:   { type: DataTypes.INTEGER, defaultValue: 1 },
  skills:      { type: DataTypes.JSON, defaultValue: [] },
}, {
  tableName: "research_roles",
  timestamps: false,
  underscored: true,
});

const ResearchApplication = sequelize.define("ResearchApplication", {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  research_id:  { type: DataTypes.UUID, allowNull: false },
  applicant_id: { type: DataTypes.STRING, allowNull: false }, // FIX: STRING not UUID
  role_title:   { type: DataTypes.STRING, allowNull: true },
  status:       { type: DataTypes.ENUM("pending", "accepted", "rejected"), defaultValue: "pending" },
  message:      { type: DataTypes.TEXT, allowNull: true },
  is_starred:   { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: "research_applications",
  timestamps: true,
  underscored: true,
});

// Profile — extended info per user for research module
const ResearchUserProfile = sequelize.define("ResearchUserProfile", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:    { type: DataTypes.STRING, allowNull: false, unique: true },
  name:       { type: DataTypes.STRING, allowNull: true },
  email:      { type: DataTypes.STRING, allowNull: true },
  role:       { type: DataTypes.STRING, allowNull: true },
  department: { type: DataTypes.STRING, allowNull: true },
  bio:        { type: DataTypes.TEXT, allowNull: true },
  skills:     { type: DataTypes.JSON, defaultValue: [] },
  avatar_url: { type: DataTypes.STRING, allowNull: true },
  linkedin:   { type: DataTypes.STRING, allowNull: true },
  github:     { type: DataTypes.STRING, allowNull: true },
  portfolio:  { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "research_user_profiles",
  timestamps: true,
  underscored: true,
});

Research.hasMany(ResearchRole,        { foreignKey: "research_id", as: "roles",        onDelete: "CASCADE" });
Research.hasMany(ResearchApplication, { foreignKey: "research_id", as: "applications", onDelete: "CASCADE" });
ResearchRole.belongsTo(Research,        { foreignKey: "research_id" });
ResearchApplication.belongsTo(Research, { foreignKey: "research_id" });

export { Research, ResearchRole, ResearchApplication, ResearchUserProfile };