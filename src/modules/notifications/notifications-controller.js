import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./notifications-service.js";

export const getNotifications  = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getNotifications(req.user.id) }));
export const markAsRead        = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.markAsRead(req.params.id, req.user.id) }));
export const markAllAsRead     = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.markAllAsRead(req.user.id) }));
export const deleteNotification= asyncHandler(async (req, res) => res.json({ success: true, data: await svc.deleteNotification(req.params.id, req.user.id) }));
export const getUnreadCount    = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getUnreadCount(req.user.id) }));