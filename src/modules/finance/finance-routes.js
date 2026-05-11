import express from "express";
import {
	getRecords,
	createRecord,
	updateRecord,
} from "./finance-controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

// All routes below require authentication
router.use(protect);

/*
* Routes dynamic to :type ('expenses' or 'advances')
*/

// Matches: getRecords()
router.get("/:type/list", getRecords);

// Matches: createRecord()
router.post("/:type/create", createRecord);

// Matches: updateRecord()
router.patch("/:type/:id/update", updateRecord);

export default router;
