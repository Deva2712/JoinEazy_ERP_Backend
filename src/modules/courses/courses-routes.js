import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { overview, registerCourse, swap, feedback } from "./courses-controller.js";

const router = express.Router();

router.get("/overview", protect, overview);
router.post("/register", protect, registerCourse);
router.put("/register/:regId/swap", protect, swap);
router.post("/:cohortId/feedback", protect, feedback);

export default router;