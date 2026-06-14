import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const StudentProfile = sequelize.define("StudentProfile", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:     { type: DataTypes.STRING, allowNull: false, unique: true },

  // Personal
  full_name:    { type: DataTypes.STRING, allowNull: true },
  dob:          { type: DataTypes.DATEONLY, allowNull: true },
  gender:       { type: DataTypes.STRING, allowNull: true },
  aadhaar_number: { type: DataTypes.STRING, allowNull: true },
  nationality:  { type: DataTypes.STRING, defaultValue: "Indian" },
  religion:     { type: DataTypes.STRING, allowNull: true },
  caste_category: { type: DataTypes.STRING, allowNull: true },
  mother_tongue:{ type: DataTypes.STRING, allowNull: true },
  physically_handicapped: { type: DataTypes.STRING, defaultValue: "No" },

  // Contact
  mobile_number:  { type: DataTypes.STRING, allowNull: true },
  alternate_mobile: { type: DataTypes.STRING, allowNull: true },
  official_email: { type: DataTypes.STRING, allowNull: true },
  personal_email: { type: DataTypes.STRING, allowNull: true },
  permanent_address: { type: DataTypes.JSON, allowNull: true },
  current_address:   { type: DataTypes.JSON, allowNull: true },
  same_address:      { type: DataTypes.BOOLEAN, defaultValue: false },

  // Family
  father:   { type: DataTypes.JSON, allowNull: true },
  mother:   { type: DataTypes.JSON, allowNull: true },
  guardian: { type: DataTypes.JSON, allowNull: true },

  // Academic
  tenth:    { type: DataTypes.JSON, allowNull: true },
  twelfth:  { type: DataTypes.JSON, allowNull: true },
  diploma:  { type: DataTypes.JSON, allowNull: true },
  ug:       { type: DataTypes.JSON, allowNull: true },
  pg:       { type: DataTypes.JSON, allowNull: true },
  career_objective: { type: DataTypes.TEXT, allowNull: true },

  // Gap
  has_gap:    { type: DataTypes.STRING, defaultValue: "No" },
  gap_year:   { type: DataTypes.STRING, allowNull: true },
  gap_reason: { type: DataTypes.TEXT, allowNull: true },

  // Medical
  blood_group:       { type: DataTypes.STRING, allowNull: true },
  medical_conditions:{ type: DataTypes.TEXT, allowNull: true },
  emergency_contact: { type: DataTypes.STRING, allowNull: true },
  emergency_name:    { type: DataTypes.STRING, allowNull: true },
  emergency_relation:{ type: DataTypes.STRING, allowNull: true },

  // Bank
  account_number: { type: DataTypes.STRING, allowNull: true },
  ifsc_code:       { type: DataTypes.STRING, allowNull: true },
  bank_name:       { type: DataTypes.STRING, allowNull: true },
  branch_name:     { type: DataTypes.STRING, allowNull: true },
  scholarship_linked: { type: DataTypes.STRING, defaultValue: "No" },

  // Passport / Visa
  passport_number: { type: DataTypes.STRING, allowNull: true },
  passport_expiry: { type: DataTypes.DATEONLY, allowNull: true },
  visa_type:       { type: DataTypes.STRING, allowNull: true },
  visa_expiry:     { type: DataTypes.DATEONLY, allowNull: true },
  nationality2:    { type: DataTypes.STRING, allowNull: true },

  // Portfolio (entrance exams, links, skills, etc.)
  portfolio: { type: DataTypes.JSON, allowNull: true, defaultValue: {
    entranceExams: [], documents: [], portfolioLinks: [],
    skills: [], certifications: [], achievements: [],
  } },

  // Profile picture
  profile_pic_url: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "student_profiles",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

const ProfileDocument = sequelize.define("ProfileDocument", {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:   { type: DataTypes.STRING, allowNull: false },
  doc_type:  { type: DataTypes.STRING, allowNull: false },
  file_name: { type: DataTypes.STRING, allowNull: false },
  file_url:  { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "profile_documents",
  timestamps: true,
  createdAt: "uploaded_at",
  updatedAt: false,
  indexes: [{ fields: ["user_id"] }],
});

export { StudentProfile, ProfileDocument };
