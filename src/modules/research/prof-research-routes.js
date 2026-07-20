// src/modules/research/prof-research-routes.js
// Mounted at: /api/v1/research  (same as before — backward compatible)
import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import * as ctrl from "./prof-research-controller.js";

const router = express.Router();
router.use(protect);

// Dashboard — any authenticated user can view
router.get("/dashboard-sync",                               ctrl.dashboard);

// CRUD
router.post("/create",           authorize("professor", "admin"),                                      ctrl.create);
router.put("/update/:id",        authorize("professor", "admin"),                                   ctrl.update);

// Roles
// FIX (security): these three had no role check at all — any authenticated user (including
// a student calling the API directly, not through the UI) could add/edit/delete "openings"
// on ANY professor's research project, since the service layer didn't check ownership either.
// Restricted to professor/admin here; ownership (must own the project, unless admin) is
// enforced in prof-research-service.js.
router.post("/:researchId/roles/create",           authorize("professor", "admin"), ctrl.createRole);
router.put("/:researchId/roles/update/:roleIndex", authorize("professor", "admin"), ctrl.updateRole);
router.delete("/:researchId/roles/delete/:roleId", authorize("professor", "admin"), ctrl.deleteRole);

// Timeline
// FIX (security): the write endpoints had the same hole as Roles above — any authenticated
// user could add/edit/delete milestones on any project. Read stays open (timeline is already
// visible to everyone via the dashboard payload), writes are now professor/admin + ownership.
router.get("/timeline/:researchId",                         ctrl.getTimeline);
router.post("/timeline/:researchId",                authorize("professor", "admin"), ctrl.addTimeline);
router.put("/timeline/:researchId/:eventId",        authorize("professor", "admin"), ctrl.updateTimeline);
router.delete("/timeline/:researchId/:eventId",     authorize("professor", "admin"), ctrl.deleteTimeline);

// Apply & Star — prof can also apply to / star other research
router.post("/apply/:id",                                   ctrl.apply);
router.post("/star/:id",                                    ctrl.star);

// Applications — prof reviews incoming
router.get("/applications/:researchId",                     ctrl.getApplications);
// FIX (security — most serious one in this module): this had no role check and, worse, the
// service never verified the requester owned the research project behind the application.
// Any logged-in user (e.g. a student) could POST /applications/:applicationId/accept and
// self-accept their own pending application, or accept/reject applications on a project that
// isn't theirs at all. Now professor/admin only, and prof-research-service.js additionally
// checks that the application's project belongs to the requester (unless admin).
router.post("/applications/:applicationId/:action", authorize("professor", "admin"), ctrl.handleApp);

// Users
router.get("/users",                                        ctrl.getUsers);
router.get("/users/profile/:userId",                        ctrl.getUserById);     // MUST be before /users/:userId
router.get("/users/:userId",                                ctrl.getUserById);
// FIX (security — IDOR): no check that :userId matched the requester. Any authenticated user
// could PUT a different user's id here and overwrite their bio/skills/links/avatar. Ownership
// (self, unless admin) is now enforced in prof-research-service.js.updateUserProfile.
router.put("/users/profile/update/:userId",                 ctrl.updateProfile);

export default router;