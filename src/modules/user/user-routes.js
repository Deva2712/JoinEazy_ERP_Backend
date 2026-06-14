import express from "express";
import { getUsers, getUser, updateUserProfile, removeUser, getDashboardOverview,
         getUserDetails, updateUserSettings, checkUsername, submitBugReport } from "./user-controller.js";
import { protect, authorize } from "../../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

// MUST be before /:id
router.get("/dashboard-overview", getDashboardOverview);
router.get("/details",            getUserDetails);
router.get("/check-username",     checkUsername);
router.put("/settings",           updateUserSettings);
router.post("/bug-report",        submitBugReport);

router.get("/", authorize("admin"), getUsers);
router.get("/:id", getUser);
router.put("/:id", updateUserProfile);
router.delete("/:id", authorize("admin"), removeUser);

export default router;
