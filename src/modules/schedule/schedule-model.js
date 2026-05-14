import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

/**
 * Stores professor availability and recurring office hour slots.
 */
export const OfficeHour = sequelize.define(
	"OfficeHour",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		userId: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		courseName: DataTypes.STRING,
		day: {
			type: DataTypes.ENUM(
				"Monday",
				"Tuesday",
				"Wednesday",
				"Thursday",
				"Friday",
				"Saturday",
				"Sunday",
			),
			allowNull: false,
		},
		startTime: DataTypes.STRING,
		endTime: DataTypes.STRING,
	},
	{
		tableName: "office_hours",
		timestamps: true,
	},
);

/**
 * Stores confirmed meetings and custom calendar events.
 */
export const ScheduledEvent = sequelize.define(
	"ScheduledEvent",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		hostId: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		participantName: DataTypes.STRING,
		participantId: DataTypes.STRING,
		participantRole: {
			type: DataTypes.STRING,
			defaultValue: "Student",
		},
		type: {
			type: DataTypes.ENUM("Online", "Offline"),
			defaultValue: "Offline",
		},
		category: {
			type: DataTypes.STRING,
			defaultValue: "Academic",
		},
		subject: DataTypes.STRING,
		startTime: DataTypes.DATE,
		location: DataTypes.STRING,
		meetingLink: DataTypes.STRING,
		status: {
			type: DataTypes.ENUM("scheduled", "rescheduled", "cancelled"),
			defaultValue: "scheduled",
		},
	},
	{
		tableName: "scheduled_events",
		timestamps: true,
	},
);

/**
 * Manages the workflow for meeting requests between students and faculty.
 */
export const MeetingRequest = sequelize.define(
	"MeetingRequest",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		senderId: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		receiverId: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		status: {
			type: DataTypes.ENUM("pending", "accepted", "rejected"),
			defaultValue: "pending",
		},
		requestedTime: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		reason: DataTypes.TEXT,
		rejectionReason: DataTypes.TEXT,
	},
	{
		tableName: "meeting_requests",
		timestamps: true,
	},
);

/**
 * Associations to the User table for ownership and participant tracking.
 */
OfficeHour.associate = (models) => {
	OfficeHour.belongsTo(models.User, { foreignKey: "userId", as: "user" });
};

ScheduledEvent.associate = (models) => {
	ScheduledEvent.belongsTo(models.User, { foreignKey: "hostId", as: "host" });
};

MeetingRequest.associate = (models) => {
	MeetingRequest.belongsTo(models.User, {
		foreignKey: "senderId",
		as: "sender",
	});
	MeetingRequest.belongsTo(models.User, {
		foreignKey: "receiverId",
		as: "receiver",
	});
};
