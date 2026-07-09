// src/modules/cohort-assignments/cohort-assignments-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import { uploadToS3 } from "../../middleware/upload.middleware.js";
import * as svc from "./cohort-assignments-service.js";

// studentId pass karo — isSubmitted per assignment aayega
export const getAssignments = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await svc.getAssignments(req.params.cohortId, req.user.id) })
);

export const createAssignment = asyncHandler(async (req, res) =>
  res.status(201).json({ success: true, data: await svc.createAssignment(req.params.cohortId, req.body, req.user.id) })
);

export const updateAssignment = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await svc.updateAssignment(req.params.cohortId, req.params.assignmentId, req.body) })
);

export const deleteAssignment = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await svc.deleteAssignment(req.params.cohortId, req.params.assignmentId) })
);

export const gradeSubmission = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await svc.gradeSubmission(req.params.assignmentId, req.body) })
);

export const getSubmissionStatus = asyncHandler(async (req, res) => {
  const ids = req.query.assignmentIds ? req.query.assignmentIds.split(",") : null;
  res.json({ success: true, data: await svc.getSubmissionStatus(req.params.cohortId, req.user?.id, ids) });
});

export const gradeGroupAssignment = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await svc.gradeAssignment(req.params.assignmentId, req.body) })
);

export const getSubmissions = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await svc.getAssignmentSubmissions(req.params.cohortId, req.params.assignmentId) })
);

// file upload support — submission_file field
export const markSubmitted = asyncHandler(async (req, res) => {
  const { cohortId, assignmentId } = req.params;
  const student = { id: req.user.id, name: req.user.name };

  let fileUrl = null;
  if (req.file) {
    const { url } = await uploadToS3(req.file, "assignments/submissions");
    fileUrl = url;
  }

  const data = await svc.submitAssignment(cohortId, assignmentId, student, req.body, fileUrl);
  res.json({ success: true, data });
});

export const unmarkSubmitted = asyncHandler(async (req, res) => {
  await svc.unsubmitAssignment(req.params.cohortId, req.params.assignmentId, req.user.id);
  res.json({ success: true, message: "Submission removed" });
});