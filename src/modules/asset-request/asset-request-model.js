import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const Asset = sequelize.define("Asset", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: true },
  category: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  location: { type: DataTypes.STRING, allowNull: true },
  capacity: { type: DataTypes.INTEGER, allowNull: true },
  quantity_available: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.ENUM("available","unavailable"), defaultValue: "available" },
}, { tableName: "assets", timestamps: true });

const AssetRequest = sequelize.define("AssetRequest", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  requester_id: { type: DataTypes.UUID, allowNull: false },
  requester_name: { type: DataTypes.STRING, allowNull: true },
  asset_id: { type: DataTypes.UUID, allowNull: true },
  asset_name: { type: DataTypes.STRING, allowNull: true },
  type: { type: DataTypes.STRING, allowNull: true },
  date: { type: DataTypes.DATEONLY, allowNull: true },
  start_time: { type: DataTypes.STRING, allowNull: true },
  end_time: { type: DataTypes.STRING, allowNull: true },
  course: { type: DataTypes.STRING, allowNull: true },
  cohort_id: { type: DataTypes.STRING, allowNull: true },
  duration_days: { type: DataTypes.INTEGER, allowNull: true },
  reason: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM("Pending","Approved","Rejected","Resubmitted"), defaultValue: "Pending" },
  rejection_reason: { type: DataTypes.TEXT, allowNull: true },
  posted_at: { type: DataTypes.DATE, allowNull: true },
  reviewed_by: { type: DataTypes.UUID, allowNull: true },
  reviewed_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: "asset_requests", timestamps: true });

export { Asset, AssetRequest };