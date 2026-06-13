import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

// ─── CohortEvent ──────────────────────────────────────────────────────────────
const CohortEvent = sequelize.define("CohortEvent", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

  cohort_id: { type: DataTypes.STRING, allowNull: false },
  created_by: { type: DataTypes.UUID, allowNull: false },
  created_by_name: { type: DataTypes.STRING, allowNull: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  location: { type: DataTypes.STRING, allowNull: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  start_time: { type: DataTypes.STRING, allowNull: true },
  end_time: { type: DataTypes.STRING, allowNull: true },
  timezone: { type: DataTypes.STRING, defaultValue: "IST" },

  // "upcoming" | "past" — auto-derived, but stored for querying
  status: { type: DataTypes.ENUM("upcoming", "past", "requested", "cancelled"), defaultValue: "upcoming" },
  participants_scope: {
    type: DataTypes.ENUM("Everyone", "Select Member", "Select Group"),
    defaultValue: "Everyone",
  },

  target_member_id: { type: DataTypes.UUID, allowNull: true },
  target_group_id: { type: DataTypes.UUID, allowNull: true },
  max_attendees: { type: DataTypes.INTEGER, allowNull: true },
  is_editable: { type: DataTypes.BOOLEAN, defaultValue: true },

}, {
  tableName: "cohort_events",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [{ fields: ["cohort_id"] }, { fields: ["date"] }, { fields: ["status"] }],
});

// ─── EventAttendee (going / not_going / maybe) ─────────────────────────────
const EventAttendee = sequelize.define("EventAttendee", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  event_id: { type: DataTypes.UUID, allowNull: false },
  user_id: { type: DataTypes.UUID, allowNull: false },
  status: { type: DataTypes.ENUM("going", "not_going", "maybe"), defaultValue: "going" },
},{
  tableName: "event_attendees",
  timestamps: false,
  indexes: [{ unique: true, fields: ["event_id", "user_id"] }],
});

// ─── EventComment ─────────────────────────────────────────────────────────────
const EventComment = sequelize.define("EventComment", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  event_id: { type: DataTypes.UUID, allowNull: false },
  user_id: { type: DataTypes.UUID, allowNull: false },
  user_name: { type: DataTypes.STRING, allowNull: true },
  user_avatar: { type: DataTypes.STRING, allowNull: true },
  user_description: { type: DataTypes.STRING, allowNull: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  likes: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: "event_comments",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
  indexes: [{ fields: ["event_id"] }],
});

// ─── Associations ─────────────────────────────────────────────────────────────
CohortEvent.hasMany(EventAttendee, { foreignKey: "event_id", as: "attendees", onDelete: "CASCADE" });
EventAttendee.belongsTo(CohortEvent, { foreignKey: "event_id" });

CohortEvent.hasMany(EventComment, { foreignKey: "event_id", as: "comments", onDelete: "CASCADE" });
EventComment.belongsTo(CohortEvent, { foreignKey: "event_id" });

export { CohortEvent, EventAttendee, EventComment };
