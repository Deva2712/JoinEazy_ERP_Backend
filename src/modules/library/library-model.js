import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

/**
 * Database schema for library inventory and circulation.
 * Tracks book details, availability, and physical stock counts.
 */
const Book = sequelize.define(
	"Book",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		title: { type: DataTypes.STRING, allowNull: false },
		author: { type: DataTypes.STRING, allowNull: false },
		isbn: { type: DataTypes.STRING, unique: true },
		category: { type: DataTypes.STRING },
		availableCopies: { type: DataTypes.INTEGER, defaultValue: 0 },
		totalCopies: { type: DataTypes.INTEGER, defaultValue: 0 },
	},
	{ tableName: "library_books" },
);

/**
 * Tracks the lifecycle of a book loan, from request to return.
 * Statuses: 'pending', 'approved', 'rejected', 'extension-pending'.
 */
const LibraryRequest = sequelize.define(
	"LibraryRequest",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		userId: { type: DataTypes.UUID, allowNull: false },
		bookId: { type: DataTypes.UUID, allowNull: false },
		status: {
			type: DataTypes.ENUM(
				"pending",
				"approved",
				"rejected",
				"extension-pending",
			),
			defaultValue: "pending",
		},
		requestDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
		approvedDate: { type: DataTypes.DATE },
		dueDate: { type: DataTypes.DATE },
		durationDays: { type: DataTypes.INTEGER },
		rejectionReason: { type: DataTypes.TEXT },
		physicalCopyPickedUp: { type: DataTypes.BOOLEAN, defaultValue: false },
	},
	{ tableName: "library_requests" },
);

/**
 * Define association to allow for eager loading (joins).
 * Links the library request to the existing 'users' table.
 */
LibraryRequest.associate = (models) => {
	LibraryRequest.belongsTo(models.User, { foreignKey: "userId", as: "user" });
};

export { Book, LibraryRequest };
