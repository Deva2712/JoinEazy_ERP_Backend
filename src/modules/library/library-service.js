import { Book, LibraryRequest } from "./library-model.js";

/**
 * Aggregates data for the Library page.
 * Combines current inventory, user requests, and active loans.
 */
export const getLibraryDashboardData = async (userId) => {
	const inventory = await Book.findAll();
	const requests = await LibraryRequest.findAll({
		where: { userId },
		include: [{ model: Book, as: "book" }],
	});

	return {
		inventory,
		// Separate 'borrowed' (approved) from 'requests' (pending/rejected) for the UI
		borrowed: requests.filter((r) => r.status === "approved"),
		requests: requests.filter((r) => r.status !== "approved"),
	};
};

/**
 * Logic to handle new book requests and extension requests.
 */
export const createRequest = async (userId, payload) => {
	const { bookId, durationDays, type } = payload;

	if (type === "extension") {
		// Find existing approved request to extend
		const original = await LibraryRequest.findOne({
			where: { id: bookId, userId, status: "approved" },
		});
		if (!original) throw new Error("Loan not found");

		return await LibraryRequest.create({
			userId,
			bookId: original.bookId,
			status: "extension-pending",
			durationDays,
		});
	}

	return await LibraryRequest.create({
		userId,
		bookId,
		durationDays,
		status: "pending",
	});
};
