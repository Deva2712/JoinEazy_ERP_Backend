import { getNotifications, markAsRead } from "./notifications-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const list = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await getNotifications(req.user.id)) });
});
export const read = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await markAsRead(req.params.id, req.user.id)) });
});