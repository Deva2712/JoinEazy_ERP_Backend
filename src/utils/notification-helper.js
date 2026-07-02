

import { Notification } from "../modules/notifications/notifications-model.js";

export const notify = async (userId, { title, message, type = "general", link = null, metadata = null }) => {
  if (!userId) return null; 
  try {
    return await Notification.create({
      user_id: String(userId),
      title,
      message,
      type,
      link,
      metadata,
      is_read: false,
    });
  } catch (err) {
      console.error("notify() failed:", err.message);
    return null;
  }
};

export const notifyMany = async (userIds = [], payload) => {
  await Promise.all(userIds.filter(Boolean).map((id) => notify(id, payload)));
};