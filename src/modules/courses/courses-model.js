import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const CourseRegistration = sequelize.define("CourseRegistration", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: { type: DataTypes.UUID, allowNull: false },
  cohort_id: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.ENUM("pending","approved","rejected","swapped"), defaultValue: "pending" },
  swap_request: { type: DataTypes.STRING, allowNull: true },
}, { tableName: "course_registrations", timestamps: true });

const CourseFeedback = sequelize.define("CourseFeedback", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: { type: DataTypes.UUID, allowNull: false },
  cohort_id: { type: DataTypes.STRING, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false },
  feedback: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: "course_feedback", timestamps: true });

export { CourseRegistration, CourseFeedback };