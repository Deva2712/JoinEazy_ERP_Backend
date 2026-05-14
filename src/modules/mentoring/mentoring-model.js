import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

/**
 * Database schema for mentoring session records.
 * Tracks session details, attendance logs, and mentor evaluations.
 */
const MentoringMeeting = sequelize.define(
	"MentoringMeeting",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		studentId: { type: DataTypes.UUID, allowNull: false },
		mentorId: { type: DataTypes.UUID, allowNull: false },
		date: { type: DataTypes.DATE, allowNull: false },
		status: {
			type: DataTypes.ENUM(
				"Requested",
				"Completed",
				"Missed",
				"Pending Documentation",
			),
			defaultValue: "Requested",
		},
		hasAttended: { type: DataTypes.BOOLEAN, defaultValue: null },
		requestReason: { type: DataTypes.TEXT },
		discussionSummary: { type: DataTypes.TEXT },
		// Structured data for student tasks and skill improvement plans
		actionPlan: { type: DataTypes.JSON },
		// Scores for academic, professional, and personal performance
		performanceRatings: { type: DataTypes.JSON },
		overallRemarks: { type: DataTypes.TEXT },
	},
	{ tableName: "mentoring_meetings" },
);

/**
 * Stores mentoring-specific student details and assignment data.
 * Used to aggregate profile information on the Mentoring dashboard.
 */
const MenteeProfile = sequelize.define(
	"MenteeProfile",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		userId: { type: DataTypes.UUID, allowNull: false, unique: true },
		mentorId: { type: DataTypes.UUID, allowNull: false },
		department: { type: DataTypes.STRING },
		section: { type: DataTypes.STRING },
		semester: { type: DataTypes.INTEGER },
		batch: { type: DataTypes.STRING },
		studentType: { type: DataTypes.STRING }, // e.g., 'Day Scholar', 'Hostelite'
	},
	{ tableName: "mentee_profiles" },
);

/**
 * Define associations for relational queries.
 * Links meetings and profiles to the primary User table.
 */
MentoringMeeting.associate = (models) => {
	MentoringMeeting.belongsTo(models.User, {
		foreignKey: "studentId",
		as: "student",
	});
	MentoringMeeting.belongsTo(models.User, {
		foreignKey: "mentorId",
		as: "mentor",
	});
};

MenteeProfile.associate = (models) => {
	MenteeProfile.belongsTo(models.User, { foreignKey: "userId", as: "user" });
	MenteeProfile.belongsTo(models.User, {
		foreignKey: "mentorId",
		as: "assignedMentor",
	});
};

export { MentoringMeeting, MenteeProfile };
