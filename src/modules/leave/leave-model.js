// src/modules/leave/leave-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const Leave = sequelize.define("Leave", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  applicant_id:   { type: DataTypes.STRING, allowNull: false },   // FIX: STRING not UUID
  applicant_name: { type: DataTypes.STRING, allowNull: false },
  leave_type:     { type: DataTypes.STRING, allowNull: false },   // FIX: STRING not ENUM — frontend sends "Sick Leave" etc.
  from_date:      { type: DataTypes.DATEONLY, allowNull: false },
  to_date:        { type: DataTypes.DATEONLY, allowNull: false },
  reason:         { type: DataTypes.TEXT, allowNull: false },
  substitute_id:  { type: DataTypes.STRING, allowNull: true },    // FIX: STRING not UUID
  substitute_status: { type: DataTypes.ENUM("pending","accepted","rejected"), defaultValue: "pending" },
  hod_status:  { type: DataTypes.ENUM("pending","approved","rejected"), defaultValue: "pending" },
  hod_remark:  { type: DataTypes.TEXT, allowNull: true },
  hr_status:   { type: DataTypes.ENUM("pending","approved","rejected"), defaultValue: "pending" },
  hr_remark:   { type: DataTypes.TEXT, allowNull: true },
  status:      { type: DataTypes.ENUM("pending","approved","rejected","Resubmitted"), defaultValue: "pending" },
  is_archived: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: "leaves", timestamps: true, underscored: true });

export default Leave;