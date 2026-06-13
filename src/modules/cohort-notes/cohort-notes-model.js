// src/modules/cohort-notes/cohort-notes-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const CohortNote = sequelize.define("CohortNote", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cohort_id:   { type: DataTypes.UUID, allowNull: false },
  author_id:   { type: DataTypes.UUID, allowNull: false },
  author_name: { type: DataTypes.STRING, allowNull: false },
  title:       { type: DataTypes.STRING, allowNull: false },
  content:     { type: DataTypes.TEXT, allowNull: true },
  color:       { type: DataTypes.STRING, defaultValue: "#ffffff" },
  is_pinned:   { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: "cohort_notes",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["cohort_id"] }, { fields: ["author_id"] }],
});

export default CohortNote;