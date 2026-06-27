import express from "express";
import cors from "cors";
import compression from "compression";
import "dotenv/config";

import authRoutes          from "./modules/auth/auth-routes.js";
import userRoutes          from "./modules/user/user-routes.js";
import announcementRoutes  from "./modules/cohort-announcements/cohort-announcements-routes.js";
import bulletinRoutes     from "./modules/bulletins/bulletins-routes.js";
import assignmentRoutes    from "./modules/cohort-assignments/cohort-assignments-routes.js";
import assignmentGradeRoutes from "./modules/cohort-assignments/cohort-assignments-grade-routes.js";
import attendanceRoutes    from "./modules/cohort-attendance/cohort-attendance-routes.js";
import boardRoutes         from "./modules/cohort-board/cohort-board-routes.js";
import eventsRoutes        from "./modules/cohort-events/cohort-events-routes.js";
import cohortRoutes      from "./modules/cohort/cohort-routes.js";
import membersRoutes     from "./modules/cohort-members/cohort-members-routes.js";
import notesRoutes       from "./modules/cohort-notes/cohort-notes-routes.js";
import resourcesRoutes   from "./modules/cohort-resources/cohort-resources-routes.js";
import meetingsRoutes    from "./modules/cohort-meetings/cohort-meetings-routes.js";
import courseRoutes      from "./modules/cohort-courses/cohort-courses-routes.js";
import maintenanceRoutes  from "./modules/maintenance/maintenance-routes.js";
import libraryRoutes      from "./modules/library/library-routes.js";
import examRoutes    from "./modules/exam-duties/exam-duties-routes.js";
import leaveRoutes   from "./modules/leave/leave-routes.js";
import financeRoutes from "./modules/finance/finance-routes.js";
import scheduleRoutes     from "./modules/schedule/schedule-routes.js";
import payrollRoutes      from "./modules/payroll/payroll-routes.js";
import notificationRoutes from "./modules/notifications/notifications-routes.js";
import researchRoutes     from "./modules/research/research-routes.js";
import mentoringRoutes    from "./modules/mentoring/mentoring-routes.js";
import sessionRoutes      from "./modules/session-planning/session-planning-routes.js";
import assetRoutes        from "./modules/asset-request/asset-request-routes.js";
import studentCourseRoutes from "./modules/courses/courses-routes.js";
import dashboardRoutes    from "./modules/dashboard/dashboard-routes.js";
import studentRoutes      from "./modules/attendance/attendance-routes.js";
import registrarRoutes from "./modules/registrar/registrar-routes.js";
import lorRoutes       from "./modules/registrar/lor-routes.js";
import studentProfileRoutes from "./modules/student-profile/student-profile-routes.js";
import calendarRoutes from "./modules/calendar/calendar-routes.js";
import materialsRoutes from "./modules/cohort-materials/cohort-materials-routes.js";
import discussionsRoutes from "./modules/cohort-discussions/cohort-discussions-routes.js";
import jobTrayRoutes from "./modules/job-tray/job-tray-routes.js";
import expensesRoutes from "./modules/expenses/expenses-routes.js";
import advancesRoutes from "./modules/advances/advances-routes.js";
import uploadRoutes from "./modules/upload/upload-routes.js";
import { professorRouter as revalProfRoutes, studentRouter as revalStudentRoutes } from "./modules/revaluation/revaluation-routes.js";
import { errorHandler }  from "./middleware/error.middleware.js";
import { requestLogger }   from "./middleware/logger.middleware.js";
import studentSessionsRoutes from "./modules/session-planning/student-sessions-routes.js";


const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000", credentials: true }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Auth & Users
app.use("/api/v1/auth",  authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/user", userRoutes); // singular alias — frontend uses /user/settings, /user/details
app.use("/api/v1/cohort",                     cohortRoutes);
// Grade route — MUST be before /:cohortId/assignments to avoid conflict
app.use("/api/v1/cohort/assignments", assignmentGradeRoutes);

// Cohort sub-modules
app.use("/api/v1/cohort/:cohortId/announcements", announcementRoutes);
app.use("/api/v1/bulletins",                       bulletinRoutes);
app.use("/api/v1/cohort/:cohortId/assignments",   assignmentRoutes);
app.use("/api/v1/cohort/:cohortId/posts",         boardRoutes);
app.use("/api/v1/cohort/:cohortId/events",        eventsRoutes);
app.use("/api/v1/cohort/:cohortId/members",   membersRoutes);
app.use("/api/v1/cohort/:cohortId/notes",     notesRoutes);
app.use("/api/v1/cohort/:cohortId/resources", resourcesRoutes);
app.use("/api/v1/cohort/:cohortId/meetings",  meetingsRoutes);
app.use("/api/v1/cohort/:cohortId/materials",     materialsRoutes);
app.use("/api/v1/cohort/:cohortId/discussions",   discussionsRoutes);
app.use("/api/v1/cohort/:cohortId/courses",   courseRoutes);


// Attendance — /api/v1/attendance/logs/:cohortId, /api/v1/professor/logs, /api/v1/courses/:courseId/attendance
app.use("/api/v1", attendanceRoutes);

// ─── Other modules ────────────────────────────────────────────────────────────
app.use("/api/v1/maintenance", maintenanceRoutes);
app.use("/api/v1/library",     libraryRoutes);
app.use("/api/v1/exams",   examRoutes);
app.use("/api/v1/leaves",  leaveRoutes);
app.use("/api/v1/expenses", expensesRoutes);
app.use("/api/v1/advances", advancesRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/finance", financeRoutes);
app.use("/api/v1/professor", scheduleRoutes);
app.use("/api/v1/payroll", payrollRoutes);

app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/student/notifications", notificationRoutes);
app.use("/api/v1/research", researchRoutes);
app.use("/api/v1/mentor", mentoringRoutes);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/student", studentSessionsRoutes);
app.use("/api/v1/assets", assetRoutes);
app.use("/api/v1/student/courses", studentCourseRoutes);
app.use("/api/v1/user", dashboardRoutes);
app.use("/api/v1/student", studentRoutes);
app.use("/api/v1", jobTrayRoutes);



app.use("/api/v1/calendar", calendarRoutes);
app.use("/api/v1/professor", revalProfRoutes);
app.use("/api/v1/student",   revalStudentRoutes);

app.use("/api/v1/registrar", registrarRoutes);
app.use("/api/v1/lor",       lorRoutes);
app.use("/api/v1/student", studentProfileRoutes);

app.get("/health", (req, res) =>
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
);

app.use(errorHandler);

export default app;