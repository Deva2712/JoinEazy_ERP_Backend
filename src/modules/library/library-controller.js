import * as LibraryService from "./library-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

// Provides the main data feed for the Library page
export const getDashboard = asyncHandler(async (req, res) => {
	const data = await LibraryService.getLibraryDashboardData(req.user.id);
	res.status(200).json({ success: true, data });
});

// Handles the creation of book borrow requests.
export const requestBook = asyncHandler(async (req, res) => {
	const { bookId, durationDays } = req.body;
	const request = await LibraryService.createRequest(req.user.id, {
		bookId,
		durationDays,
	});
	res.status(201).json({ success: true, data: request });
});

// Endpoint for students to request more time on a borrowed item.
export const extendLoan = asyncHandler(async (req, res) => {
	const { bookId, additionalDays } = req.body;
	const extension = await LibraryService.createRequest(req.user.id, {
		bookId,
		durationDays: additionalDays,
		type: "extension",
	});
	res.status(201).json({ success: true, data: extension });
});
