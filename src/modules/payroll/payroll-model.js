import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const Payroll = sequelize.define("Payroll", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  month: { type: DataTypes.STRING, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  basic: { type: DataTypes.FLOAT, defaultValue: 0 },
  hra: { type: DataTypes.FLOAT, defaultValue: 0 },
  da: { type: DataTypes.FLOAT, defaultValue: 0 },
  ta: { type: DataTypes.FLOAT, defaultValue: 0 },
  other_allowances: { type: DataTypes.FLOAT, defaultValue: 0 },
  pf_deduction: { type: DataTypes.FLOAT, defaultValue: 0 },
  tax_deduction: { type: DataTypes.FLOAT, defaultValue: 0 },
  other_deductions: { type: DataTypes.FLOAT, defaultValue: 0 },
  net_salary: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.ENUM("paid","pending","processing"), defaultValue: "pending" },
  slip_url: { type: DataTypes.STRING, allowNull: true },
}, { tableName: "payrolls", timestamps: true });

export default Payroll;