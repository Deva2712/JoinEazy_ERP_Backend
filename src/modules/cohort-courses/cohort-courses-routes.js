import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as ctrl from "./cohort-courses-controller.js";

const router = express.Router({ mergeParams: true });
router.use(protect);

// All courses in a cohort
router.get("/", ctrl.getCourses);
router.post("/", ctrl.createCourse);

// Single course
router.get("/:courseId", ctrl.getCourseById);
router.put("/:courseId", ctrl.updateCourse);
router.delete("/:courseId", ctrl.deleteCourse);

// Submissions
router.get("/:courseId/submissions", ctrl.getSubmissions);
router.post("/:courseId/submit", ctrl.submitCourse);
router.delete("/:courseId/submit", ctrl.unsubmitCourse);
router.post("/:courseId/grade", ctrl.gradeSubmission);

// Comments
router.post("/:courseId/comments", ctrl.addComment);
router.delete("/:courseId/comments/:commentId", ctrl.deleteComment);

export default router;
