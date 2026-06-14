import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const BugReport = sequelize.define("BugReport", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  reported_by: { type: DataTypes.STRING, allowNull: false },
  reporter_name: { type: DataTypes.STRING, allowNull: true },
  reporter_email: { type: DataTypes.STRING, allowNull: true },
  title:       { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  category:    { type: DataTypes.STRING, allowNull: true },
  severity:    { type: DataTypes.ENUM("low", "medium", "high", "critical"), defaultValue: "medium" },
  page_url:    { type: DataTypes.STRING, allowNull: true },
  screenshot_url: { type: DataTypes.TEXT, allowNull: true },
  status:      { type: DataTypes.ENUM("open", "in_progress", "resolved", "closed"), defaultValue: "open" },
}, {
  tableName: "bug_reports",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export { BugReport };
