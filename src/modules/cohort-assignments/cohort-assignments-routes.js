import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import * as ctrl from "./cohort-assignments-controller.js";

const router = express.Router({ mergeParams: true });
router.use(protect);

router.get("/submissions/status",              ctrl.getSubmissionStatus);       // GET  /assignments/submissions/status
router.get("/",                                ctrl.getAssignments);            // GET  /assignments
router.post("/",   authorize("professor","admin"), ctrl.createAssignment);      // POST /assignments
router.get("/:assignmentId/submissions",       ctrl.getSubmissions);            // GET  /assignments/:id/submissions
router.post("/:assignmentId/submit",           ctrl.markSubmitted);             // POST /assignments/:id/submit
router.delete("/:assignmentId/submit",         ctrl.unmarkSubmitted);           // DELETE /assignments/:id/submit
router.put("/:assignmentId",   authorize("professor","admin"), ctrl.updateAssignment);
router.delete("/:assignmentId", authorize("professor","admin"), ctrl.deleteAssignment);

export default router;