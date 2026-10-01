import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./placement-service.js";

export const getOverview = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.getOverview(req.user.id));
});

export const getOffers = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.getOffers(req.user.id));
});

export const applyToJob = asyncHandler(async (req, res) => {
  res.status(201).json(await svc.applyToJob(req.user.id, req.user, req.params.jobId));
});

export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
  res.status(200).json(await svc.updateResume(req.user.id, req.file));
});

export const uploadPortfolio = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
  res.status(200).json(await svc.updatePortfolioDocument(req.user.id, req.file));
});

export const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.getPlacementProfile(req.user.id));
});

export const updateProfile = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.updatePlacementProfile(req.user.id, req.body));
});

export const updateOfferStatus = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.updateOfferStatus(req.user.id, req.params.offerId, req.body.status));
});

export const getAssessmentResults = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.getAssessmentResults(req.user.id, req.params.jobId));
});

export const getTrainingSessions = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.getTrainingSessions());
});

export const getTrainingSession = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.getTrainingSession(req.params.sessionId));
});

export const getSessionAttendance = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.getSessionAttendance(req.params.sessionId));
});

export const getStudentAttendance = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.getTrainingAttendanceForUser(req.params.studentId, req.user));
});

export const upsertAttendance = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.upsertAttendance(req.user, req.body));
});

export const upsertBulkAttendance = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.upsertBulkAttendance(req.user, req.body.entries || []));
});

export const getTrainingScores = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.getTrainingScores(req.query.studentId, req.user));
});

export const getTrainingTests = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.getTrainingTests());
});

export const getTrainingCourses = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.getTrainingCourses(req.query.studentId, req.user));
});

export const enrollInCourse = asyncHandler(async (req, res) => {
  res.status(201).json(await svc.enrollInCourse(req.user.id, req.body));
});

export const createTrainingCourse = asyncHandler(async (req, res) => {
  res.status(201).json(await svc.createTrainingCourse(req.user, req.body));
});

export const updateTrainingCourse = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.updateTrainingCourse(req.user, req.params.id, req.body));
});

export const deleteTrainingCourse = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.deleteTrainingCourse(req.user, req.params.id));
});

export const createTrainingSession = asyncHandler(async (req, res) => {
  res.status(201).json(await svc.createTrainingSession(req.user, req.body));
});

export const updateTrainingSession = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.updateTrainingSession(req.user, req.params.id, req.body));
});

export const deleteTrainingSession = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.deleteTrainingSession(req.user, req.params.id));
});

export const createTrainingTest = asyncHandler(async (req, res) => {
  res.status(201).json(await svc.createTrainingTest(req.user, req.body));
});

export const updateTrainingTest = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.updateTrainingTest(req.user, req.params.id, req.body));
});

export const deleteTrainingTest = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.deleteTrainingTest(req.user, req.params.id));
});

export const createTrainingScore = asyncHandler(async (req, res) => {
  res.status(201).json(await svc.createTrainingScore(req.body));
});

export const updateTrainingScore = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.updateTrainingScore(req.params.id, req.body));
});

export const getProfessorOverview = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.getProfessorOverview(req.query.branch));
});

export const getProfessorPrograms = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.getProfessorPrograms(req.user.id));
});

export const getPlacementApplications = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.getPlacementApplications());
});

export const getCurrentStudents = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: await svc.getCurrentStudents() });
});

export const getCompanies = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.getCompanies());
});

export const getCompany = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.getCompany(req.params.id));
});

export const getTrainingInstructors = asyncHandler(async (req, res) => {
  res.status(200).json(await svc.getTrainingInstructors());
});
