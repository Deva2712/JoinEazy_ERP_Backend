import "dotenv/config";
import app from "./src/app.js";
import { connectDB } from "./src/database/connection.js";
import logger from "./src/utils/logger.js";

// ── Import ALL models so Sequelize knows about them before sync ───────────────
import "./src/modules/auth/auth-model.js";
import "./src/modules/cohort/cohort-model.js";
import "./src/modules/cohort-assignments/cohort-assignments-model.js";
import "./src/modules/cohort-announcements/cohort-announcements-model.js";
import "./src/modules/cohort-attendance/cohort-attendance-model.js";
import "./src/modules/cohort-board/cohort-board-model.js";
import "./src/modules/cohort-events/cohort-events-model.js";
import "./src/modules/cohort-courses/cohort-courses-model.js";
import "./src/modules/cohort-resources/cohort-resources-model.js";
import "./src/modules/cohort-notes/cohort-notes-model.js";
import "./src/modules/cohort-members/cohort-members-model.js";
import "./src/modules/cohort-meetings/cohort-meetings-model.js";
import "./src/modules/bulletins/bulletins-model.js";
import "./src/modules/expenses/expenses-model.js";
import "./src/modules/advances/advances-model.js";
import "./src/modules/maintenance/maintenance-model.js";
import "./src/modules/library/library-model.js";
import "./src/modules/department/department-model.js";
import "./src/modules/exam-duties/exam-duties-model.js";
import "./src/modules/leave/leave-model.js";
import "./src/modules/finance/finance-model.js";
import "./src/modules/schedule/schedule-model.js";
import "./src/modules/payroll/payroll-model.js";
import "./src/modules/notifications/notifications-model.js";
import "./src/modules/research/research-model.js";
import "./src/modules/mentoring/mentoring-model.js";
import "./src/modules/session-planning/session-planning-model.js";
import "./src/modules/asset-request/asset-request-model.js";
import "./src/modules/courses/courses-model.js";
import "./src/modules/attendance/attendance-model.js";
import "./src/modules/revaluation/revaluation-model.js";
import "./src/modules/registrar/registrar-model.js";



const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
    });
  })
  .catch((err) => {
    logger.error("Failed to connect to database:", err);
    process.exit(1);
  });