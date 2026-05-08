import express from "express";
import { getDashboard, requestBook, extendLoan } from "./library-controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

// All routes below require authentication
router.use(protect);

// Matches: getLibraryDashboard()
router.get("/dashboard", getDashboard);

// Matches: requestBook()
router.post("/request", requestBook);

// Matches: requestExtension()
router.post("/extend", extendLoan);

export default router;
