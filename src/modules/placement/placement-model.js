import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";
import User from "../auth/auth-model.js";

const uuidPrimaryKey = {
  type: DataTypes.UUID,
  defaultValue: DataTypes.UUIDV4,
  primaryKey: true,
};

const PlacementCompany = sequelize.define("PlacementCompany", {
  id: { ...uuidPrimaryKey },
  name: { type: DataTypes.STRING, allowNull: true },
  sector: { type: DataTypes.STRING, allowNull: true },
  tier: { type: DataTypes.STRING, allowNull: true },
  profile: { type: DataTypes.TEXT, allowNull: true },
  website: { type: DataTypes.STRING, allowNull: true },
  schools: { type: DataTypes.JSON, allowNull: true },
  engagementScore: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active" },
}, {
  tableName: "placement_companies",
  timestamps: true,
});

const PlacementJob = sequelize.define("PlacementJob", {
  id: { ...uuidPrimaryKey },
  companyId: { type: DataTypes.UUID, allowNull: true },
  companyName: { type: DataTypes.STRING, allowNull: true },
  role: { type: DataTypes.STRING, allowNull: true },
  type: { type: DataTypes.STRING, allowNull: true },
  location: { type: DataTypes.STRING, allowNull: true },
  package: { type: DataTypes.STRING, allowNull: true },
  stipend: { type: DataTypes.STRING, allowNull: true },
  duration: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  requirements: { type: DataTypes.JSON, allowNull: true },
  openings: { type: DataTypes.INTEGER, allowNull: true },
  minCgpa: { type: DataTypes.FLOAT, allowNull: true },
  branches: { type: DataTypes.JSON, allowNull: true },
  batchYear: { type: DataTypes.INTEGER, allowNull: true },
  maxBacklogs: { type: DataTypes.INTEGER, allowNull: true },
  graduationYear: { type: DataTypes.INTEGER, allowNull: true },
  jdUrl: { type: DataTypes.STRING, allowNull: true },
  jdFileUrl: { type: DataTypes.STRING, allowNull: true },
  jdFileName: { type: DataTypes.STRING, allowNull: true },
  applicationFormUrl: { type: DataTypes.STRING, allowNull: true },
  additionalInfo: { type: DataTypes.TEXT, allowNull: true },
  rounds: { type: DataTypes.STRING, allowNull: true },
  postedAt: { type: DataTypes.DATE, allowNull: true },
  deadline: { type: DataTypes.DATE, allowNull: true },
  archived: { type: DataTypes.BOOLEAN, defaultValue: false },
  status: { type: DataTypes.ENUM("open", "closed", "draft"), defaultValue: "open" },
  createdBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: "placement_jobs",
  timestamps: true,
});

const PlacementApplication = sequelize.define("PlacementApplication", {
  id: { ...uuidPrimaryKey },
  jobId: { type: DataTypes.UUID, allowNull: true },
  studentId: { type: DataTypes.UUID, allowNull: true },
  studentName: { type: DataTypes.STRING, allowNull: true },
  studentRoll: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM("Applied", "Shortlisted", "Interview", "Selected", "Rejected"), defaultValue: "Applied" },
  currentRound: { type: DataTypes.INTEGER, allowNull: true },
  resumeUrl: { type: DataTypes.STRING, allowNull: true },
  appliedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "placement_applications",
  timestamps: true,
});

const PlacementOffer = sequelize.define("PlacementOffer", {
  id: { ...uuidPrimaryKey },
  applicationId: { type: DataTypes.UUID, allowNull: true },
  jobId: { type: DataTypes.UUID, allowNull: true },
  studentId: { type: DataTypes.UUID, allowNull: true },
  studentName: { type: DataTypes.STRING, allowNull: true },
  studentRollNo: { type: DataTypes.STRING, allowNull: true },
  studentBranch: { type: DataTypes.STRING, allowNull: true },
  companyId: { type: DataTypes.UUID, allowNull: true },
  companyName: { type: DataTypes.STRING, allowNull: true },
  role: { type: DataTypes.STRING, allowNull: true },
  ctc: { type: DataTypes.STRING, allowNull: true },
  ctcValue: { type: DataTypes.FLOAT, allowNull: true },
  joiningDate: { type: DataTypes.DATEONLY, allowNull: true },
  location: { type: DataTypes.STRING, allowNull: true },
  sector: { type: DataTypes.STRING, allowNull: true },
  ppo: { type: DataTypes.BOOLEAN, allowNull: true },
  offCampus: { type: DataTypes.BOOLEAN, allowNull: true },
  letterUrl: { type: DataTypes.STRING, allowNull: true },
  letterFileName: { type: DataTypes.STRING, allowNull: true },
  letterSentAt: { type: DataTypes.DATE, allowNull: true },
  status: { type: DataTypes.ENUM("Pending", "Accepted", "Rejected", "Deferred"), defaultValue: "Pending" },
}, {
  tableName: "placement_offers",
  timestamps: true,
});

const PlacementAssessmentResult = sequelize.define("PlacementAssessmentResult", {
  id: { ...uuidPrimaryKey },
  jobId: { type: DataTypes.UUID, allowNull: true },
  studentId: { type: DataTypes.UUID, allowNull: true },
  rollNo: { type: DataTypes.STRING, allowNull: true },
  result: { type: DataTypes.STRING, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  uploadedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "placement_assessment_results",
  timestamps: true,
});

const PlacementTrainingCourse = sequelize.define("PlacementTrainingCourse", {
  id: { ...uuidPrimaryKey },
  name: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  eligibleBranches: { type: DataTypes.JSON, allowNull: true },
  eligibleYears: { type: DataTypes.JSON, allowNull: true },
  minCgpa: { type: DataTypes.FLOAT, allowNull: true },
  capacity: { type: DataTypes.INTEGER, allowNull: true },
  startDate: { type: DataTypes.DATEONLY, allowNull: true },
  endDate: { type: DataTypes.DATEONLY, allowNull: true },
  instructorIds: { type: DataTypes.JSON, allowNull: true },
  guestInstructors: { type: DataTypes.JSON, allowNull: true },
  defaultInstructor: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM("active", "completed", "upcoming"), defaultValue: "upcoming" },
}, {
  tableName: "placement_training_courses",
  timestamps: true,
});

const PlacementTrainingSession = sequelize.define("PlacementTrainingSession", {
  id: { ...uuidPrimaryKey },
  courseId: { type: DataTypes.UUID, allowNull: true },
  type: { type: DataTypes.STRING, allowNull: true },
  category: { type: DataTypes.STRING, allowNull: true },
  title: { type: DataTypes.STRING, allowNull: true },
  instructor: { type: DataTypes.STRING, allowNull: true },
  instructorId: { type: DataTypes.UUID, allowNull: true },
  date: { type: DataTypes.DATE, allowNull: true },
  endDate: { type: DataTypes.DATE, allowNull: true },
  capacity: { type: DataTypes.INTEGER, allowNull: true },
  mode: { type: DataTypes.ENUM("online", "offline", "hybrid"), allowNull: true },
  venue: { type: DataTypes.STRING, allowNull: true },
  link: { type: DataTypes.STRING, allowNull: true },
  eligibleBranches: { type: DataTypes.JSON, allowNull: true },
  minCgpa: { type: DataTypes.FLOAT, allowNull: true },
  prerequisites: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM("scheduled", "completed", "cancelled"), defaultValue: "scheduled" },
}, {
  tableName: "placement_training_sessions",
  timestamps: true,
});

const PlacementTrainingAttendance = sequelize.define("PlacementTrainingAttendance", {
  id: { ...uuidPrimaryKey },
  sessionId: { type: DataTypes.UUID, allowNull: true },
  studentId: { type: DataTypes.UUID, allowNull: true },
  studentRollNo: { type: DataTypes.STRING, allowNull: true },
  registered: { type: DataTypes.BOOLEAN, defaultValue: false },
  present: { type: DataTypes.BOOLEAN, defaultValue: false },
  notes: { type: DataTypes.TEXT, allowNull: true },
  markedBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: "placement_training_attendance",
  timestamps: true,
});

const PlacementTrainingTest = sequelize.define("PlacementTrainingTest", {
  id: { ...uuidPrimaryKey },
  courseId: { type: DataTypes.UUID, allowNull: true },
  instructorId: { type: DataTypes.UUID, allowNull: true },
  category: { type: DataTypes.STRING, allowNull: true },
  testNumber: { type: DataTypes.INTEGER, allowNull: true },
  title: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  testLink: { type: DataTypes.STRING, allowNull: true },
  maxScore: { type: DataTypes.FLOAT, allowNull: true },
  date: { type: DataTypes.DATEONLY, allowNull: true },
}, {
  tableName: "placement_training_tests",
  timestamps: true,
});

const PlacementTrainingScore = sequelize.define("PlacementTrainingScore", {
  id: { ...uuidPrimaryKey },
  testId: { type: DataTypes.UUID, allowNull: true },
  studentId: { type: DataTypes.UUID, allowNull: true },
  studentRollNo: { type: DataTypes.STRING, allowNull: true },
  score: { type: DataTypes.FLOAT, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  recordedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "placement_training_scores",
  timestamps: true,
});

const PlacementCourseEnrollment = sequelize.define("PlacementCourseEnrollment", {
  id: { ...uuidPrimaryKey },
  courseId: { type: DataTypes.UUID, allowNull: true },
  studentId: { type: DataTypes.UUID, allowNull: true },
  status: { type: DataTypes.ENUM("enrolled", "completed", "dropped"), defaultValue: "enrolled" },
  enrolledAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "placement_course_enrollments",
  timestamps: true,
});

PlacementCompany.hasMany(PlacementJob, { foreignKey: "companyId" });
PlacementJob.belongsTo(PlacementCompany, { foreignKey: "companyId" });

User.hasMany(PlacementJob, { foreignKey: "createdBy" });
PlacementJob.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

PlacementJob.hasMany(PlacementApplication, { foreignKey: "jobId" });
PlacementApplication.belongsTo(PlacementJob, { foreignKey: "jobId" });
User.hasMany(PlacementApplication, { foreignKey: "studentId" });
PlacementApplication.belongsTo(User, { foreignKey: "studentId", as: "student" });

PlacementApplication.hasMany(PlacementOffer, { foreignKey: "applicationId" });
PlacementOffer.belongsTo(PlacementApplication, { foreignKey: "applicationId" });
PlacementJob.hasMany(PlacementOffer, { foreignKey: "jobId" });
PlacementOffer.belongsTo(PlacementJob, { foreignKey: "jobId" });
PlacementCompany.hasMany(PlacementOffer, { foreignKey: "companyId" });
PlacementOffer.belongsTo(PlacementCompany, { foreignKey: "companyId" });
User.hasMany(PlacementOffer, { foreignKey: "studentId" });
PlacementOffer.belongsTo(User, { foreignKey: "studentId", as: "student" });

PlacementJob.hasMany(PlacementAssessmentResult, { foreignKey: "jobId" });
PlacementAssessmentResult.belongsTo(PlacementJob, { foreignKey: "jobId" });
User.hasMany(PlacementAssessmentResult, { foreignKey: "studentId" });
PlacementAssessmentResult.belongsTo(User, { foreignKey: "studentId", as: "student" });

PlacementTrainingCourse.hasMany(PlacementTrainingSession, { foreignKey: "courseId" });
PlacementTrainingSession.belongsTo(PlacementTrainingCourse, { foreignKey: "courseId" });
User.hasMany(PlacementTrainingSession, { foreignKey: "instructorId" });
PlacementTrainingSession.belongsTo(User, { foreignKey: "instructorId", as: "instructorUser" });

PlacementTrainingSession.hasMany(PlacementTrainingAttendance, { foreignKey: "sessionId" });
PlacementTrainingAttendance.belongsTo(PlacementTrainingSession, { foreignKey: "sessionId" });
User.hasMany(PlacementTrainingAttendance, { foreignKey: "studentId" });
PlacementTrainingAttendance.belongsTo(User, { foreignKey: "studentId", as: "student" });
User.hasMany(PlacementTrainingAttendance, { foreignKey: "markedBy" });
PlacementTrainingAttendance.belongsTo(User, { foreignKey: "markedBy", as: "marker" });

PlacementTrainingCourse.hasMany(PlacementTrainingTest, { foreignKey: "courseId" });
PlacementTrainingTest.belongsTo(PlacementTrainingCourse, { foreignKey: "courseId" });
User.hasMany(PlacementTrainingTest, { foreignKey: "instructorId" });
PlacementTrainingTest.belongsTo(User, { foreignKey: "instructorId", as: "instructorUser" });
PlacementTrainingTest.hasMany(PlacementTrainingScore, { foreignKey: "testId" });
PlacementTrainingScore.belongsTo(PlacementTrainingTest, { foreignKey: "testId" });
User.hasMany(PlacementTrainingScore, { foreignKey: "studentId" });
PlacementTrainingScore.belongsTo(User, { foreignKey: "studentId", as: "student" });

PlacementTrainingCourse.hasMany(PlacementCourseEnrollment, { foreignKey: "courseId" });
PlacementCourseEnrollment.belongsTo(PlacementTrainingCourse, { foreignKey: "courseId" });
User.hasMany(PlacementCourseEnrollment, { foreignKey: "studentId" });
PlacementCourseEnrollment.belongsTo(User, { foreignKey: "studentId", as: "student" });

export {
  PlacementCompany,
  PlacementJob,
  PlacementApplication,
  PlacementOffer,
  PlacementAssessmentResult,
  PlacementTrainingCourse,
  PlacementTrainingSession,
  PlacementTrainingAttendance,
  PlacementTrainingTest,
  PlacementTrainingScore,
  PlacementCourseEnrollment,
};
