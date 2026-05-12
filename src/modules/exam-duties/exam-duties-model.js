import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

/**
 * Schema for exam invigilation duties.
 * Tracks assignment details, check-in status, and the rejection workflow.
 */
const ExamDuty = sequelize.define(
	"ExamDuty",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		userId: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		courseName: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		courseCode: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		type: {
			type: DataTypes.STRING, // e.g., 'Final Exam', 'Midterm'
		},
		startTime: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		endTime: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		hall: {
			type: DataTypes.STRING,
		},
		reportingTime: {
			type: DataTypes.DATE,
		},
		status: {
			type: DataTypes.ENUM(
				"ASSIGNED",
				"REJECTION_REVIEW",
				"REJECTION_REVOKED",
				"REJECTION_APPROVED",
			),
			defaultValue: "ASSIGNED",
		},
		isCheckedIn: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		rejectionReason: {
			type: DataTypes.TEXT,
		},
		/**
		 * Stores structured approval data from different departments.
		 * Format: { exam_department: { status, remark }, admin: { status, remark } }
		 */
		rejectionApproval: {
			type: DataTypes.JSONB,
			allowNull: true,
		},
	},
	{
		tableName: "exam_duties",
		timestamps: true,
	},
);

ExamDuty.associate = (models) => {
	ExamDuty.belongsTo(models.User, { foreignKey: "userId", as: "user" });
};

export default ExamDuty;
