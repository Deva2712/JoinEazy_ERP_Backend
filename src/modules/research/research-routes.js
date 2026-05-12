import express from "express";
import * as ctrl from "./research-controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

// All routes below require authentication
router.use(protect);

// Dashboard and Core Creation
router.get("/dashboard-sync", ctrl.getResearchDashboard);
router.post("/create", ctrl.createResearchWork);
router.post("/update/:id", ctrl.updateResearchWork);
router.post("/star/:id", ctrl.toggleStar);

// Role Management
router.post("/:id/roles/create", ctrl.handleRoleAction);
router.put("/:id/roles/update/:roleId", ctrl.handleRoleAction);
router.delete("/:id/roles/delete/:roleId", ctrl.handleRoleAction);

// Timeline Management
router.get("/timeline/:id", ctrl.handleTimelineAction);
router.post("/timeline/:id", ctrl.handleTimelineAction);
router.put("/timeline/:id/:eventId", ctrl.handleTimelineAction);
router.delete("/timeline/:id/:eventId", ctrl.handleTimelineAction);

// Application Workflow
router.post("/apply/:id", ctrl.submitApplication);
router.post("/applications/:appId/:action", ctrl.processApplication);

// Grant Requests
router.post("/grants/create", ctrl.createGrantRequest);
router.post("/grants/update/:id", ctrl.resubmitGrantRequest);

// Researcher Profiles
router.get("/users/profile/:userId", ctrl.getUserProfile);
router.post("/users/profile/update/:userId", ctrl.updateProfile);

export default router;
