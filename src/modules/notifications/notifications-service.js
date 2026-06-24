import { Notification } from "./notifications-model.js";
import { Op } from "sequelize";

// ─── GET all notifications for user ──────────────────────────────────────────
export const getNotifications = async (userId) => {
  const notifications = await Notification.findAll({
    where: { user_id: String(userId) },
    order: [["created_at", "DESC"]],
    limit: 100,
  });
  return notifications.map(n => ({
    ...n.toJSON(),
    isRead: n.is_read,
    createdAt: n.created_at,
  }));
};

export const markAsRead = async (notifId, userId) => {
  const notif = await Notification.findOne({ where: { id: notifId, user_id: String(userId) } });
  if (!notif) { const e = new Error("Notification not found"); e.statusCode = 404; throw e; }
  await notif.update({ is_read: true });
  return { marked: true };
};

export const markAllAsRead = async (userId) => {
  await Notification.update({ is_read: true }, { where: { user_id: String(userId), is_read: false } });
  return { marked: true };
};

export const deleteNotification = async (notifId, userId) => {
  await Notification.destroy({ where: { id: notifId, user_id: String(userId) } });
  return { deleted: true };
};

export const getUnreadCount = async (userId) => {
  const count = await Notification.count({ where: { user_id: String(userId), is_read: false } });
  return { count };
};