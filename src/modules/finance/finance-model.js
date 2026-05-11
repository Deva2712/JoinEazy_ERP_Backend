import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

/**
 * Database schema for financial operations.
 * Supports both 'Expense' (reimbursements) and 'Advance' (pre-payments) via the 'type' field.
 */
const FinanceRecord = sequelize.define(
	"FinanceRecord",
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
		type: {
			type: DataTypes.ENUM("expenses", "advances"),
			allowNull: false,
		},
		title: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		amount: {
			type: DataTypes.FLOAT,
			allowNull: false,
		},
		status: {
			type: DataTypes.ENUM(
				"Pending",
				"Approved",
				"Rejected",
				"Reimbursed",
				"Resubmitted",
			),
			defaultValue: "Pending",
		},
		category: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		description: {
			type: DataTypes.TEXT,
		},
		proofDocLink: {
			type: DataTypes.STRING,
		},
		adminComments: {
			type: DataTypes.TEXT,
		},
		approvalTime: {
			type: DataTypes.DATE,
		},
		// Stores the previous state of a record when a user resubmits after a rejection.
		previousVersion: {
			type: DataTypes.JSONB,
			allowNull: true,
		},
	},
	{
		tableName: "finance_records",
		timestamps: true,
	},
);

/**
 * Define association to allow for eager loading (joins).
 * Links the finance record to the existing 'users' table.
 */
FinanceRecord.associate = (models) => {
	FinanceRecord.belongsTo(models.User, { foreignKey: "userId", as: "user" });
};

export default FinanceRecord;
