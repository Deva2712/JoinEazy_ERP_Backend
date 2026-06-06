// src/modules/cohort-announcements/cohort-announcements-cron.js

import cron from "node-cron";
import { autoArchiveOldAnnouncements } from "./cohort-announcements-service.js";

// Runs every day at midnight — auto-archives announcements older than 2 days
cron.schedule("0 0 * * *", async () => {
  try {
    await autoArchiveOldAnnouncements(); // no cohortId = runs for all cohorts
    console.log("[CRON] Auto-archive announcements: done");
  } catch (err) {
    console.error("[CRON] Auto-archive announcements failed:", err.message);
  }
});