import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const Expense = sequelize.define("Expense", {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  submitted_by:   { type: DataTypes.UUID, allowNull: false },
  submitted_name: { type: DataTypes.STRING, allowNull: true },
  title:          { type: DataTypes.STRING, allowNull: false },
  category:       { type: DataTypes.STRING, allowNull: true },
  description:    { type: DataTypes.TEXT, allowNull: true },
  amount_spent:   { type: DataTypes.FLOAT, allowNull: false },
  receipt_link:   { type: DataTypes.TEXT, allowNull: true },
  proof_doc_link: { type: DataTypes.TEXT, allowNull: true },
  proof_doc_file: { type: DataTypes.STRING, allowNull: true },
  status:         { type: DataTypes.ENUM("Pending", "Approved", "Rejected", "Resubmitted"), defaultValue: "Pending" },
  admin_comments: { type: DataTypes.TEXT, allowNull: true },
  reviewed_by:    { type: DataTypes.UUID, allowNull: true },
  reviewed_at:    { type: DataTypes.DATE, allowNull: true },
  is_archived:    { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: "expenses",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [{ fields: ["submitted_by"] }, { fields: ["status"] }],
});

export { Expense };