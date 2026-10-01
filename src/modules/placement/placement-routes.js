import express from "express";
import multer from "multer";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import * as ctrl from "./placement-controller.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(protect);

router.get("/overview", authorize("student"), ctrl.getOverview);
router.get("/offers", authorize("student"), ctrl.getOffers);
router.post("/apply/:jobId", authorize("student"), ctrl.applyToJob);
router.post("/documents/resume", authorize("student"), upload.single("resume"), ctrl.uploadResume);
router.post("/documents/portfolio", authorize("student"), upload.single("portfolio"), ctrl.uploadPortfolio);
router.get("/profile", authorize("student"), ctrl.getProfile);
router.patch("/profile", authorize("student"), ctrl.updateProfile);
router.patch("/offers/:offerId/status", authorize("student"), ctrl.updateOfferStatus);
router.get("/jobs/:jobId/assessment/results", authorize("student"), ctrl.getAssessmentResults);

router.get("/prof/programs", authorize("professor"), ctrl.getProfessorPrograms);
router.get("/prof/overview", authorize("professor"), ctrl.getProfessorOverview);
router.get("/coord/applications", authorize("student", "professor"), ctrl.getPlacementApplications);
router.get("/students/current", authorize("student", "professor"), ctrl.getCurrentStudents);
router.get("/companies", authorize("student", "professor"), ctrl.getCompanies);
router.get("/companies/:id", authorize("student", "professor"), ctrl.getCompany);

router.get("/training/instructors", authorize("student", "professor"), ctrl.getTrainingInstructors);
router.get("/training/sessions", authorize("student", "professor"), ctrl.getTrainingSessions);
router.post("/training/sessions", authorize("professor"), ctrl.createTrainingSession);
router.get("/training/sessions/:sessionId", authorize("student", "professor"), ctrl.getTrainingSession);
router.patch("/training/sessions/:id", authorize("professor"), ctrl.updateTrainingSession);
router.delete("/training/sessions/:id", authorize("professor"), ctrl.deleteTrainingSession);
router.get("/training/sessions/:sessionId/attendance", authorize("student", "professor"), ctrl.getSessionAttendance);
router.get("/training/attendance/student/:studentId", authorize("student", "professor"), ctrl.getStudentAttendance);
router.post("/training/attendance", authorize("student", "professor"), ctrl.upsertAttendance);
router.post("/training/attendance/bulk", authorize("professor"), ctrl.upsertBulkAttendance);
router.get("/training/scores", authorize("student", "professor"), ctrl.getTrainingScores);
router.post("/training/scores", authorize("professor"), ctrl.createTrainingScore);
router.patch("/training/scores/:id", authorize("professor"), ctrl.updateTrainingScore);
router.get("/training/tests", authorize("student", "professor"), ctrl.getTrainingTests);
router.post("/training/tests", authorize("professor"), ctrl.createTrainingTest);
router.patch("/training/tests/:id", authorize("professor"), ctrl.updateTrainingTest);
router.delete("/training/tests/:id", authorize("professor"), ctrl.deleteTrainingTest);
router.get("/training/courses", authorize("student", "professor"), ctrl.getTrainingCourses);
router.get("/training", authorize("student", "professor"), ctrl.getTrainingCourses);
router.post("/training", authorize("professor"), ctrl.createTrainingCourse);
router.patch("/training/:id", authorize("professor"), ctrl.updateTrainingCourse);
router.delete("/training/:id", authorize("professor"), ctrl.deleteTrainingCourse);
router.post("/training/enrollments", authorize("student"), ctrl.enrollInCourse);

export default router;
