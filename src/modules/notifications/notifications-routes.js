import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as ctrl from "./notifications-controller.js";

const router = express.Router();
router.use(protect);

// Professor notifications
router.get("/",                ctrl.getNotifications);
router.post("/:id/read",       ctrl.markAsRead);
router.post("/mark-all-read",  ctrl.markAllAsRead);
router.delete("/:id",          ctrl.deleteNotification);
router.get("/unread-count",    ctrl.getUnreadCount);

export default router;