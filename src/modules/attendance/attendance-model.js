import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

/**
 * Database schema for student attendance records.
 * recordedBy: The UUID of the faculty member/admin who submitted the log.
 * cohortId: The specific course being marked.
 */
export const Attendance = sequelize.define(
	"Attendance",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		recordedBy: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		cohortId: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		section: {
			type: DataTypes.STRING,
			defaultValue: "All",
		},
		date: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
		presentStudentIds: {
			type: DataTypes.JSONB,
			defaultValue: [],
		},
		isFinal: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		lastUpdated: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		tableName: "attendance_logs",
		timestamps: true,
	},
);

/**
 * Tracks professor-specific clock-in/out records and professional activity.
 */
export const ProfessorLog = sequelize.define(
	"ProfessorLog",
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
		date: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
		type: {
			type: DataTypes.ENUM("WorkLog", "Experience"),
			defaultValue: "WorkLog",
		},
		details: {
			type: DataTypes.JSONB,
			allowNull: false,
		},
	},
	{
		tableName: "professor_activity_logs",
		timestamps: true,
	},
);

/**
 * Links the attendance record to the 'users' and 'cohorts' tables.
 */
Attendance.associate = (models) => {
	Attendance.belongsTo(models.User, {
		foreignKey: "recordedBy",
		as: "faculty",
	});
	Attendance.belongsTo(models.Cohort, {
		foreignKey: "cohortId",
		as: "cohort",
	});
};

/**
 * Links professor logs to the 'users' table.
 */
ProfessorLog.associate = (models) => {
	ProfessorLog.belongsTo(models.User, { foreignKey: "userId", as: "user" });
};
