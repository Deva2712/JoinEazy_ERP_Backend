import express from "express";
import cors from "cors";
import compression from "compression";
import "dotenv/config";

// Route imports
import authRoutes from "./modules/auth/auth-routes.js";
import userRoutes from "./modules/user/user-routes.js";
import announcementRoutes from "./modules/cohort-announcements/cohort-announcements-routes.js";
import assignmentRoutes from "./modules/cohort-assignments/cohort-assignments-routes.js";


// Middleware imports
import { errorHandler } from "./middleware/error.middleware.js";
import { requestLogger } from "./middleware/logger.middleware.js";

const app = express();

// ─── Core Middleware ───────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));

//compress all json responses
app.use(compression());



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

// Cohort Announcements routes are mounted with :cohortId param
app.use("/api/v1/cohort/:cohortId/announcements", announcementRoutes);
app.use("/api/v1/cohort/:cohortId/assignments", assignmentRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Error Handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

export default app;
