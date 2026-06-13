import Notification from "./notifications-model.js";

export const getNotifications = async (userId) => {
  const notifications = await Notification.findAll({ where: { user_id: userId }, order: [["createdAt","DESC"]] });
  return { notifications };
};

export const markAsRead = async (id, userId) => {
  const notification = await Notification.findOne({ where: { id, user_id: userId } });
  if (!notification) { const err = new Error("Notification not found"); err.statusCode = 404; throw err; }
  await notification.update({ is_read: true });
  return { notification };
};