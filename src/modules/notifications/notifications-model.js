import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const Notification = sequelize.define("Notification", {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:  { type: DataTypes.STRING, allowNull: false },
  title:    { type: DataTypes.STRING, allowNull: false },
  message:  { type: DataTypes.TEXT, allowNull: true },
  type:     { type: DataTypes.STRING, allowNull: true, defaultValue: "general" },
  link:     { type: DataTypes.STRING, allowNull: true },
  is_read:  { type: DataTypes.BOOLEAN, defaultValue: false },
  metadata: { type: DataTypes.JSON, allowNull: true },
}, {
  tableName: "notifications",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
  indexes: [{ fields: ["user_id"] }, { fields: ["is_read"] }],
});

export { Notification };