import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

/**
 * Schema for Leave Applications.
 * Supports substitution details and hierarchical approval tracking.
 */
export const LeaveApplication = sequelize.define(
	"LeaveApplication",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		applicantId: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		leaveType: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		fromDate: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		toDate: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		reason: DataTypes.TEXT,
		substitutionDetails: {
			type: DataTypes.JSONB,
			defaultValue: {},
		},
		replacementFacultyId: DataTypes.UUID,
		substitutionStatus: {
			type: DataTypes.ENUM("Pending", "Accepted", "Declined"),
			defaultValue: "Pending",
		},
		status: {
			type: DataTypes.STRING,
			defaultValue: "Pending",
		},
		leaveApproval: {
			type: DataTypes.JSONB,
			defaultValue: {
				HoD: { status: "Pending", remark: null },
				HR: { status: "Pending", remark: null },
			},
		},
		isArchived: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		supportingDocLink: DataTypes.STRING,
	},
	{
		tableName: "leave_applications",
		timestamps: true,
	},
);

/**
 * Define association to allow for eager loading (joins).
 * Links the leave application to the existing 'users' table.
 */
LeaveApplication.associate = (models) => {
	LeaveApplication.belongsTo(models.User, {
		foreignKey: "applicantId",
		as: "applicant",
	});
	LeaveApplication.belongsTo(models.User, {
		foreignKey: "replacementFacultyId",
		as: "replacement",
	});
};
