import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { attendance, markQR, timetable, tasks, createTask, toggleTask, deleteTask, sessions } from "./attendance-controller.js";

const router = express.Router();

router.get("/attendance", protect, attendance);
router.post("/attendance/qr", protect, markQR);
router.get("/timetable", protect, timetable);
router.get("/tasks", protect, tasks);
router.post("/tasks", protect, createTask);
router.patch("/tasks/:taskId/toggle", protect, toggleTask);
router.delete("/tasks/:taskId", protect, deleteTask);
router.get("/sessions", protect, sessions);

export default router;