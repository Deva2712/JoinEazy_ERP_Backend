import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import { overview, registerCourse, cancelRegistration, swap, feedback,
         getRegistrationProfile, saveRegistrationProfile,
         listCourses, createCourse, updateCourse, deleteCourse, updateWindow, runAllocation } from "./courses-controller.js";

const router = express.Router();

router.get("/overview", protect, overview);
router.get("/registration-profile", protect, getRegistrationProfile);
router.post("/registration-profile", protect, saveRegistrationProfile);
router.post("/register", protect, registerCourse);
router.delete("/register/:regId", protect, cancelRegistration);
router.patch("/register/:regId/swap", protect, swap);
router.post("/:cohortId/feedback", protect, feedback);

// ─── Admin/Registrar: manage course catalog + registration window ───────────
router.get("/admin/courses", protect, authorize("admin", "staff"), listCourses);
router.post("/admin/courses", protect, authorize("admin", "staff"), createCourse);
router.patch("/admin/courses/:courseId", protect, authorize("admin", "staff"), updateCourse);
router.delete("/admin/courses/:courseId", protect, authorize("admin", "staff"), deleteCourse);
router.patch("/admin/window", protect, authorize("admin", "staff"), updateWindow);
// Runs the CGPA-ranked seat allocation for every pending elective registration.
router.post("/admin/run-allocation", protect, authorize("admin", "staff"), runAllocation);

export default router;