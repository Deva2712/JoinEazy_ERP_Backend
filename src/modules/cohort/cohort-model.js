// src/modules/cohort/cohort-model.js
import { DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import sequelize from "../../database/connection.js";

const Cohort = sequelize.define("Cohort", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => uuidv4(), 
  },
  cohort_name:        { type: DataTypes.STRING, allowNull: false },
  cohort_description: { type: DataTypes.TEXT, allowNull: true },
  course_codes:       { type: DataTypes.STRING, allowNull: true },
  slug:               { type: DataTypes.STRING, allowNull: true, unique: true },
  organization_name:  { type: DataTypes.STRING, defaultValue: "Mahindra University" },
  instructor:         { type: DataTypes.STRING, allowNull: true },
  creator_id:         { type: DataTypes.STRING, allowNull: false },
  creator_name:       { type: DataTypes.STRING, allowNull: false },
  start_date:         { type: DataTypes.DATE, allowNull: true },
  end_date:           { type: DataTypes.DATE, allowNull: true },
  status:             { type: DataTypes.ENUM("Live", "Archived", "Draft"), defaultValue: "Live" },
  visibility:         { type: DataTypes.ENUM("Active", "Archived", "Private"), defaultValue: "Active" },
  member_count:       { type: DataTypes.INTEGER, defaultValue: 0 },
  group_count:        { type: DataTypes.INTEGER, defaultValue: 0 },
  invitation_token:   { type: DataTypes.STRING, allowNull: true },
  invitation_expires: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: "cohorts",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["creator_id"] }, { fields: ["slug"] }, { fields: ["status"] }],
});

const CohortDetailSection = sequelize.define("CohortDetailSection", {
  id:                 { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cohort_id:          { type: DataTypes.STRING, allowNull: false },
  title:              { type: DataTypes.STRING, allowNull: false },
  subsec_description: { type: DataTypes.TEXT, allowNull: true },
  order:              { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: "cohort_detail_sections",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["cohort_id"] }],
});

const CohortGroup = sequelize.define("CohortGroup", {
  id:                { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cohort_id:         { type: DataTypes.STRING, allowNull: false },
  group_name:        { type: DataTypes.STRING, allowNull: false },
  group_description: { type: DataTypes.TEXT, allowNull: true },
  project_name:      { type: DataTypes.STRING, allowNull: true },
  max_members:       { type: DataTypes.INTEGER, defaultValue: 4 },
  invite_token:      { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "cohort_groups",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["cohort_id"] }],
});

const CohortGroupMember = sequelize.define("CohortGroupMember", {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  group_id:  { type: DataTypes.UUID, allowNull: false },
  user_id:   { type: DataTypes.STRING, allowNull: false },
  email:     { type: DataTypes.STRING, allowNull: true },
  role:      { type: DataTypes.ENUM("leader", "member"), defaultValue: "member" },
  joined_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "cohort_group_members",
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ["group_id", "user_id"] }],
});

const CohortParticipant = sequelize.define("CohortParticipant", {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cohort_id:    { type: DataTypes.STRING, allowNull: false },
  user_id:      { type: DataTypes.STRING, allowNull: true },
  email:        { type: DataTypes.STRING, allowNull: false },
  display_name: { type: DataTypes.STRING, allowNull: true },
  username:     { type: DataTypes.STRING, allowNull: true },
  roll_number:  { type: DataTypes.STRING, allowNull: true },
  profile_pic:  { type: DataTypes.STRING, allowNull: true },
  is_active:    { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: "cohort_participants",
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ["cohort_id"] },
    { unique: true, fields: ["cohort_id", "email"] },
  ],
});

// Associations
Cohort.hasMany(CohortDetailSection, { foreignKey: "cohort_id", as: "detail_sections", onDelete: "CASCADE" });
Cohort.hasMany(CohortGroup,         { foreignKey: "cohort_id", as: "groups",          onDelete: "CASCADE" });
Cohort.hasMany(CohortParticipant,   { foreignKey: "cohort_id", as: "participants",     onDelete: "CASCADE" });
CohortGroup.hasMany(CohortGroupMember, { foreignKey: "group_id", as: "CohortGroupMembers", onDelete: "CASCADE" });

export { Cohort, CohortDetailSection, CohortGroup, CohortGroupMember, CohortParticipant };