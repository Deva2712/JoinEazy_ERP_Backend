import express from "express";
import cors from "cors";
import compression from "compression";
import "dotenv/config";

import authRoutes         from "./modules/auth/auth-routes.js";
import userRoutes         from "./modules/user/user-routes.js";
import announcementRoutes from "./modules/cohort-announcements/cohort-announcements-routes.js";
import assignmentRoutes   from "./modules/cohort-assignments/cohort-assignments-routes.js";
import attendanceRoutes   from "./modules/cohort-attendance/cohort-attendance-routes.js";
import boardRoutes        from "./modules/cohort-board/cohort-board-routes.js";
import eventsRoutes       from "./modules/cohort-events/cohort-events-routes.js";
import courseRoutes       from "./modules/cohort-courses/cohort-courses-routes.js";


import { errorHandler }   from "./middleware/error.middleware.js";
import { requestLogger }  from "./middleware/logger.middleware.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Cohort sub-modules — MUST be before cohort core to avoid :cohortId conflicts
app.use("/api/v1/cohort/:cohortId/announcements", announcementRoutes);
app.use("/api/v1/cohort/:cohortId/assignments",   assignmentRoutes);
app.use("/api/v1/cohort/:cohortId/posts",         boardRoutes);
app.use("/api/v1/cohort/:cohortId/events",        eventsRoutes);
// app.use("/api/v1/cohort/:cohortId/notes",         notesRoutes);
// app.use("/api/v1/cohort/:cohortId/resources",     resourcesRoutes);
// app.use("/api/v1/cohort/:cohortId/members",       membersRoutes);
// app.use("/api/v1/cohort/:cohortId/courses",       coursesRoutes);
// app.use("/api/v1/cohort/:cohortId/meetings",      meetingsRoutes);
 
// Cohort core — after sub-modules
app.use("/api/v1/cohort", cohortRoutes);
 
app.use("/api/v1", attendanceRoutes);
app.get("/health", (req, res) => res.status(200).json({ status: "ok", timestamp: new Date().toISOString() }));

app.use(errorHandler);

export default app;