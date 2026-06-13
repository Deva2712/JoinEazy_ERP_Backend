import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const RevaluationRequest = sequelize.define("RevaluationRequest", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: { type: DataTypes.UUID, allowNull: false },
  professor_id: { type: DataTypes.UUID, allowNull: true },
  subject: { type: DataTypes.STRING, allowNull: false },
  exam_type: { type: DataTypes.STRING, allowNull: true },
  reason: { type: DataTypes.TEXT, allowNull: true },
  current_marks: { type: DataTypes.FLOAT, allowNull: true },
  revised_marks: { type: DataTypes.FLOAT, allowNull: true },
  status: { type: DataTypes.ENUM("pending","under_review","accepted","rejected","resolved"), defaultValue: "pending" },
  remarks: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: "revaluation_requests", timestamps: true });

export default RevaluationRequest;