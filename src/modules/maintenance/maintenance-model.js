// src/modules/maintenance/maintenance-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const MaintenanceRequest = sequelize.define("MaintenanceRequest", {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  requester_id: { type: DataTypes.STRING, allowNull: false },
  requester_name:{ type: DataTypes.STRING, allowNull: false },
  category:     { type: DataTypes.STRING, allowNull: false },       // electrical, plumbing, etc.
  location:     { type: DataTypes.STRING, allowNull: false },       // room/building
  title:        { type: DataTypes.STRING, allowNull: false },
  description:  { type: DataTypes.TEXT, allowNull: true },
  priority:     { type: DataTypes.ENUM("low", "medium", "high", "urgent"), defaultValue: "medium" },
  status:       { type: DataTypes.ENUM("pending", "in-progress", "resolved", "rejected"), defaultValue: "pending" },
  status_note:  { type: DataTypes.STRING, allowNull: true },
  image_url:    { type: DataTypes.STRING, allowNull: true },
  resolved_at:  { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: "maintenance_requests",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["requester_id"] }, { fields: ["status"] }],
});

export default MaintenanceRequest;