import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

/**
 * Database schema for employee payroll records.
 * Stores payment status, totals, and a JSON blob for itemized financial breakdowns.
 */
const Payroll = sequelize.define(
	"Payroll",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		payrollId: {
			type: DataTypes.STRING, // External reference ID, e.g., "PAY-JAN-26"
			allowNull: false,
		},
		userId: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		month: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		amount: {
			type: DataTypes.FLOAT,
			allowNull: false,
		},
		status: {
			type: DataTypes.ENUM("Paid", "Pending", "Processing"),
			defaultValue: "Paid",
		},
		paidAt: {
			type: DataTypes.DATE, // Can be null if status is Pending
			allowNull: true,
		},
		breakdown: {
			type: DataTypes.JSONB, // Flexible JSON object containing arrays for earnings and deductions
			allowNull: false,
		},
	},
	{
		tableName: "payrolls",
		timestamps: true,
	},
);

/**
 * Define association to allow for eager loading (joins).
 * Links the payroll record to the existing 'users' table.
 */
Payroll.associate = (models) => {
	Payroll.belongsTo(models.User, { foreignKey: "userId", as: "user" });
};

export default Payroll;
