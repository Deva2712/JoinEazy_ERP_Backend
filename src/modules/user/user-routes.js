import express from "express";
import { getUsers, getUser, updateUserProfile, removeUser, getDashboardOverview } from "./user-controller.js";
import { protect, authorize } from "../../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

// MUST be before /:id
router.get("/dashboard-overview", getDashboardOverview);

router.get("/", authorize("admin"), getUsers);
router.get("/:id", getUser);
router.put("/:id", updateUserProfile);
router.delete("/:id", authorize("admin"), removeUser);

export default router;