import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { attendance, qr, timetable, tasks, createTask, toggleTask, deleteTask, sessions } from "./attendance-controller.js";

const router = express.Router();

router.get("/attendance", protect, attendance);
router.get("/attendance/qr", protect, qr);
router.get("/timetable", protect, timetable);
router.get("/tasks", protect, tasks);
router.post("/tasks", protect, createTask);
router.patch("/tasks/:taskId/toggle", protect, toggleTask);
router.delete("/tasks/:taskId", protect, deleteTask);
router.get("/sessions", protect, sessions);

export default router;