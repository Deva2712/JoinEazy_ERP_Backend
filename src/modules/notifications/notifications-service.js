import { Notification } from "./notifications-model.js";
import { Op } from "sequelize";

// ─── GET all notifications for user ──────────────────────────────────────────
export const getNotifications = async (userId) => {
  const notifications = await Notification.findAll({
    where: { user_id: userId },
    order: [["created_at", "DESC"]],
    limit: 100,
  });
  return notifications.map(n => ({
    ...n.toJSON(),
    isRead: n.is_read,
    createdAt: n.created_at,
  }));
};

// ─── MARK single as read ──────────────────────────────────────────────────────
export const markAsRead = async (notifId, userId) => {
  const notif = await Notification.findOne({ where: { id: notifId, user_id: userId } });
  if (!notif) { const e = new Error("Notification not found"); e.statusCode = 404; throw e; }
  await notif.update({ is_read: true });
  return { marked: true };
};

// ─── MARK all as read ─────────────────────────────────────────────────────────
export const markAllAsRead = async (userId) => {
  await Notification.update({ is_read: true }, { where: { user_id: userId, is_read: false } });
  return { marked: true };
};

// ─── DELETE a notification ────────────────────────────────────────────────────
export const deleteNotification = async (notifId, userId) => {
  await Notification.destroy({ where: { id: notifId, user_id: userId } });
  return { deleted: true };
};

// ─── CREATE notification (internal use — called from other modules) ───────────
export const createNotification = async ({ userId, title, message, type = "general", link = null, metadata = null }) => {
  const notif = await Notification.create({ user_id: userId, title, message, type, link, metadata });
  return notif.toJSON();
};

// ─── CREATE bulk notifications (e.g. announce to all cohort members) ──────────
export const createBulkNotifications = async (userIds, data) => {
  const records = userIds.map(uid => ({
    user_id: uid,
    title: data.title,
    message: data.message,
    type: data.type || "general",
    link: data.link || null,
    metadata: data.metadata || null,
  }));
  await Notification.bulkCreate(records);
  return { sent: records.length };
};

// ─── GET unread count ─────────────────────────────────────────────────────────
export const getUnreadCount = async (userId) => {
  const count = await Notification.count({ where: { user_id: userId, is_read: false } });
  return { count };
};