// src/modules/leave/leave-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const Leave = sequelize.define("Leave", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  applicant_id:   { type: DataTypes.STRING, allowNull: false },
  applicant_name: { type: DataTypes.STRING, allowNull: false },
  leave_type:     { type: DataTypes.STRING, allowNull: false },
  from_date:      { type: DataTypes.DATEONLY, allowNull: false },
  to_date:        { type: DataTypes.DATEONLY, allowNull: false },
  reason:         { type: DataTypes.TEXT, allowNull: false },
  substitute_id:   { type: DataTypes.STRING, allowNull: true },
  substitute_name: { type: DataTypes.STRING, allowNull: true },
  course_name:     { type: DataTypes.STRING, allowNull: true },
  room_number:     { type: DataTypes.STRING, allowNull: true },
  start_time:      { type: DataTypes.STRING, allowNull: true },
  end_time:        { type: DataTypes.STRING, allowNull: true },
  note:            { type: DataTypes.TEXT,   allowNull: true },

  // Supporting document — file URL (S3) ya external link
  supporting_doc_url:  { type: DataTypes.STRING(1000), allowNull: true },

  substitute_status: { type: DataTypes.STRING, defaultValue: "Pending" },
  hod_status:         { type: DataTypes.STRING, defaultValue: "Pending" },
  hod_remark:         { type: DataTypes.TEXT, allowNull: true },
  hr_status:          { type: DataTypes.STRING, defaultValue: "Pending" },
  hr_remark:          { type: DataTypes.TEXT, allowNull: true },
  status:             { type: DataTypes.STRING, defaultValue: "Pending" },

  is_archived: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: "leaves",
  timestamps: true,
  underscored: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Leave;