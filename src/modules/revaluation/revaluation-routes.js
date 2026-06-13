import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import * as ctrl from "./revaluation-controller.js";

// Professor router
const professorRouter = express.Router();
professorRouter.get("/revaluation/overview", protect, authorize("professor","admin"), ctrl.profOverview);
professorRouter.get("/revaluation/requests", protect, authorize("professor","admin"), ctrl.profRequests);
professorRouter.post("/revaluation/requests/:requestId/accept", protect, authorize("professor","admin"), ctrl.accept);
professorRouter.post("/revaluation/requests/:requestId/reject", protect, authorize("professor","admin"), ctrl.reject);
professorRouter.post("/revaluation/requests/:requestId/result", protect, authorize("professor","admin"), ctrl.result);

// Student router
const studentRouter = express.Router();
studentRouter.get("/revaluation/overview", protect, ctrl.studentOverview);
studentRouter.get("/revaluation/requests", protect, ctrl.studentRequests);
studentRouter.get("/revaluation/subjects", protect, ctrl.subjects);
studentRouter.post("/revaluation/requests", protect, ctrl.createRequest);
studentRouter.delete("/revaluation/requests/:requestId", protect, ctrl.cancelRequest);

export { professorRouter, studentRouter };