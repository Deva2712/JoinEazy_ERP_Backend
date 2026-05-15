import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

/**
 * Database schema for Academic Cohorts.
 * name: The display name of the cohort (e.g., "Introduction to Computer Science").
 * slug: URL-friendly identifier for direct access.
 * sections: Stores section-specific metrics like syllabus completion and student counts.
 */
export const Cohort = sequelize.define(
	"Cohort",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		slug: {
			type: DataTypes.STRING,
			unique: true,
		},
		courseCodes: {
			type: DataTypes.JSONB,
			defaultValue: [],
		},
		academicYear: {
			type: DataTypes.STRING,
		},
		semester: {
			type: DataTypes.INTEGER,
		},
		year: {
			type: DataTypes.STRING,
		},
		description: {
			type: DataTypes.TEXT,
		},
		status: {
			type: DataTypes.ENUM("Live", "Archived", "Ended"),
			defaultValue: "Live",
		},
		visibility: {
			type: DataTypes.ENUM("Active", "Inactive"),
			defaultValue: "Active",
		},
		startDate: {
			type: DataTypes.DATE,
		},
		endDate: {
			type: DataTypes.DATE,
		},
		credits: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		sections: {
			type: DataTypes.JSONB,
			defaultValue: [],
		},
		createdBy: {
			type: DataTypes.UUID,
			allowNull: false,
		},
	},
	{
		tableName: "cohorts",
		timestamps: true,
	},
);

/**
 * Defines associations for the Cohort.
 */
Cohort.associate = (models) => {
	Cohort.belongsTo(models.User, {
		foreignKey: "createdBy",
		as: "creator",
	});
	Cohort.hasMany(models.Attendance, {
		foreignKey: "cohortId",
		as: "attendanceLogs",
	});
};