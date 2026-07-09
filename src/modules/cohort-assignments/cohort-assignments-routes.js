// src/modules/cohort-assignments/cohort-assignments-routes.js
import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import { upload } from "../../middleware/upload.middleware.js";
import * as ctrl from "./cohort-assignments-controller.js";

const router = express.Router({ mergeParams: true });
router.use(protect);

router.get("/submissions/status",                                          ctrl.getSubmissionStatus);
router.get("/",                                                            ctrl.getAssignments);
router.post("/",          authorize("professor", "admin"),                 ctrl.createAssignment);
router.get("/:assignmentId/submissions",                                   ctrl.getSubmissions);
router.post("/:assignmentId/submit", ...upload("submission_file", "assignments/submissions"), ctrl.markSubmitted);
router.delete("/:assignmentId/submit",                                     ctrl.unmarkSubmitted);
router.put("/:assignmentId",  authorize("professor", "admin"),             ctrl.updateAssignment);
router.delete("/:assignmentId", authorize("professor", "admin"),           ctrl.deleteAssignment);

export default router;