import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as ctrl from "./calendar-controller.js";

const router = express.Router();
router.use(protect);

router.get("/events",           ctrl.getEvents);
router.post("/events",          ctrl.createEvent);
router.delete("/events/:eventId", ctrl.deleteEvent);

export default router;