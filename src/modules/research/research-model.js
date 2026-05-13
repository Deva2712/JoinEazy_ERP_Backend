import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";
import User from "../auth/auth-model.js";

/**
 * Main table for Research Projects and Publications.
 * Associates with User as 'owner'.
 */
export const ResearchWork = sequelize.define(
	"ResearchWork",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		ownerId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: "users", key: "id" },
		},
		title: { type: DataTypes.STRING, allowNull: false },
		type: {
			type: DataTypes.ENUM("Project", "Publication"),
			allowNull: false,
		},
		abstract: { type: DataTypes.TEXT },
		status: { type: DataTypes.STRING, defaultValue: "Open" },
		category: DataTypes.STRING,
		department: DataTypes.STRING,
		starsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
		// List of roles currently hiring (e.g. [{id, roleName, description}])
		openRoles: { type: DataTypes.JSONB, defaultValue: [] },
		// Sequence of milestones (e.g. [{id, title, date, status}])
		timeline: { type: DataTypes.JSONB, defaultValue: [] },
		// Flat list of current team member names (for quick display)
		members: { type: DataTypes.JSONB, defaultValue: [] },
	},
	{ tableName: "research_works", timestamps: true },
);

/**
 * Tracks individual applications for roles within a project.
 * Connects a User (applicant) to a ResearchWork.
 */
export const ResearchApplication = sequelize.define(
	"ResearchApplication",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		researchId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: "research_works", key: "id" },
		},
		userId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: "users", key: "id" },
		},
		roleId: DataTypes.STRING, // Links to the ID in ResearchWork.openRoles
		roleName: DataTypes.STRING,
		status: {
			type: DataTypes.ENUM("Pending", "Accepted", "Rejected"),
			defaultValue: "Pending",
		},
		professorNotes: DataTypes.TEXT,
	},
	{ tableName: "research_applications", timestamps: true },
);

/**
 * Tracks financial aid/grant requests.
 */
export const GrantRequest = sequelize.define(
	"GrantRequest",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		userId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: "users", key: "id" },
		},
		researchId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: "research_works", key: "id" },
		},
		requestId: { type: DataTypes.STRING, unique: true },
		amount: DataTypes.DECIMAL(10, 2),
		status: {
			type: DataTypes.ENUM(
				"Pending",
				"Approved",
				"Rejected",
				"Resubmitted",
			),
			defaultValue: "Pending",
		},
		reason: DataTypes.TEXT,
		adminComments: DataTypes.TEXT,
		previousVersion: { type: DataTypes.JSONB }, // For history tracking
	},
	{ tableName: "research_grants", timestamps: true },
);

// --- Associations ---
// Research & Ownership
User.hasMany(ResearchWork, { foreignKey: "ownerId" });
ResearchWork.belongsTo(User, { as: "owner", foreignKey: "ownerId" });

// Applications (Relationship between Researcher and Work)
User.hasMany(ResearchApplication, { foreignKey: "userId" });
ResearchApplication.belongsTo(User, { foreignKey: "userId" });
ResearchWork.hasMany(ResearchApplication, { foreignKey: "researchId" });
ResearchApplication.belongsTo(ResearchWork, { foreignKey: "researchId" });

// Grants
User.hasMany(GrantRequest, { foreignKey: "userId" });
GrantRequest.belongsTo(User, { foreignKey: "userId" });
ResearchWork.hasMany(GrantRequest, { foreignKey: "researchId" });
GrantRequest.belongsTo(ResearchWork, { foreignKey: "researchId" });
