// src/modules/courses/courses-cron.js

import cron from "node-cron";
import { RegistrationWindow } from "./courses-model.js";
import { runAllocation } from "./courses-service.js";

// Runs every 15 minutes — if the registration window's deadline (window_end) has
// passed and results haven't been published yet, automatically closes the window
// and runs the CGPA-ranked elective allocation. Registrar no longer has to
// remember to trigger POST /admin/run-allocation manually on the final date.
cron.schedule("*/15 * * * *", async () => {
  try {
    const config = await RegistrationWindow.findByPk(1);
    if (!config) return;

    const deadlinePassed = config.window_end && new Date(config.window_end) <= new Date();
    if (!deadlinePassed || config.results_published) return;

    console.log("[CRON] Registration window closed — running elective allocation...");
    const result = await runAllocation(); // also sets results_published = true
    await config.update({ is_open: false });
    console.log(`[CRON] Allocation done. Allocated: ${result.allocated}, Rejected: ${result.rejected}`);
  } catch (err) {
    console.error("[CRON] Course allocation check failed:", err.message);
  }
});