import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const JobTrayItem = sequelize.define("JobTrayItem", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false }, // student/professor jisko yeh job dikhna hai
  type: { type: DataTypes.STRING, allowNull: false },  // e.g. "assignment", "fee_due", "leave_update", "meeting"
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM("pending","completed","dismissed"), defaultValue: "pending" },
  link: { type: DataTypes.STRING, allowNull: true },     // frontend route to navigate to
  priority: { type: DataTypes.ENUM("low","normal","high"), defaultValue: "normal" },
}, { tableName: "job_tray_items", timestamps: true });

export { JobTrayItem };