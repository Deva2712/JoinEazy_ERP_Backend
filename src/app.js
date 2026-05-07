import express from "express";
import cors from "cors";
import "dotenv/config";

// Route imports
import authRoutes from "./modules/auth/auth-routes.js";
import userRoutes from "./modules/user/user-routes.js";
import payrollRoutes from "./modules/payroll/payroll-routes.js";

// Middleware imports
import { errorHandler } from "./middleware/error.middleware.js";
import { requestLogger } from "./middleware/logger.middleware.js";

const app = express();

// ─── Core Middleware ───────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/payroll", payrollRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Error Handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

export default app;
