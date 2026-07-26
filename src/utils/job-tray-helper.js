// src/utils/job-tray-helper.js

import { JobTrayItem } from "../modules/job-tray/job-tray-model.js";

// FIX (functional gap): JobTrayItem existed as a model + read/dismiss API, but nothing
// anywhere in the codebase ever created a row — the Job Tray was permanently empty for
// every user. This helper mirrors notification-helper.js's `notify()`/`notifyMany()`
// pattern so modules can push an actionable "pending task" the same way they already
// push a notification.
export const addJob = async (userId, { type, title, message = null, link = null, priority = "normal" }) => {
  if (!userId) return null;
  try {
    return await JobTrayItem.create({
      user_id: String(userId),
      type,
      title,
      message,
      link,
      priority,
      status: "pending",
    });
  } catch (err) {
    console.error("addJob() failed:", err.message);
    return null;
  }
};

export const addJobToMany = async (userIds = [], payload) => {
  await Promise.all(userIds.filter(Boolean).map((id) => addJob(id, payload)));
};