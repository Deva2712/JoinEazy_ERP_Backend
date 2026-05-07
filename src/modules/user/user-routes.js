import express from "express";
import { getUsers, getUser, updateUserProfile, removeUser } from "./user-controller.js";
import { protect, authorize } from "../../middleware/auth.middleware.js";

const router = express.Router();

// All routes below require authentication
router.use(protect);

router.get("/", authorize("admin"), getUsers);
router.get("/:id", getUser);
router.put("/:id", updateUserProfile);
router.delete("/:id", authorize("admin"), removeUser);

export default router;
