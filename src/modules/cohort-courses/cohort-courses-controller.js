import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./cohort-courses-service.js";
import User from "../auth/auth-model.js";

export const getCourses      = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getCourses(req.params.cohortId, req.user.id) }));
export const getCourseById   = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getCourseById(req.params.courseId, req.user.id) }));
export const createCourse    = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.createCourse(req.params.cohortId, req.body, req.user.id) }));
export const updateCourse    = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.updateCourse(req.params.cohortId, req.params.courseId, req.body, req.user.id) }));
export const deleteCourse    = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.deleteCourse(req.params.cohortId, req.params.courseId, req.user.id) }));
export const getSubmissions  = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getSubmissions(req.params.courseId) }));

export const submitCourse = asyncHandler(async (req, res) => {
  const data = await svc.submitCourse(req.params.courseId, req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const unsubmitCourse = asyncHandler(async (req, res) => {
  const data = await svc.unsubmitCourse(req.params.courseId, req.user.id);
  res.json({ success: true, data });
});

export const gradeSubmission = asyncHandler(async (req, res) => {
  const { submittedBy, marksAwarded, feedback } = req.body;
  const data = await svc.gradeSubmission(req.params.courseId, submittedBy, marksAwarded, feedback);
  res.json({ success: true, data });
});

export const addComment = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: ["name"] });
  const data = await svc.addComment(req.params.courseId, req.user.id, req.body.content, user?.name);
  res.status(201).json({ success: true, data });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const data = await svc.deleteComment(req.params.commentId, req.user.id);
  res.json({ success: true, data });
});
