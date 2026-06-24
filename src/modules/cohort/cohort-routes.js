// src/modules/cohort/cohort-routes.js
import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import * as ctrl from "./cohort-controller.js";
import multer from "multer";


const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// ─── Public/semi-public ───────────────────────────────────────────────────────
router.get("/slug/:slug",            protect, ctrl.getCohortBySlug);
router.get("/archived",              protect, ctrl.getArchivedCohorts);
router.post("/check-expired",        protect, ctrl.checkExpired);
router.get("/invitation-info",               ctrl.getInvitationInfo);       // ?token=xxx (no auth needed)
router.post("/join-with-invitation",         ctrl.joinWithInvitation);      // { token, email, name }
router.post("/group/accept-invite",  protect, ctrl.acceptGroupInvite);
router.delete("/group/:groupId/remove-member", protect, ctrl.removeGroupMember);
router.post("/group/:groupId/add-members",     protect, ctrl.addMembersToGroup);

// ─── Cohort CRUD ──────────────────────────────────────────────────────────────
router.post("/create",  protect, authorize("professor", "admin"), ctrl.createCohort);
router.get("/:cohortId/details",  protect, ctrl.getCohortDetails);
router.get("/:cohortId",          protect, ctrl.getCohortById);
router.patch("/edit/:cohortId",   protect, authorize("professor", "admin"), ctrl.updateCohort);
router.delete("/:cohortId([0-9a-f-]{36})", protect, authorize("professor", "admin"), ctrl.deleteCohort);

// ─── Invitation ───────────────────────────────────────────────────────────────
router.post("/:cohortId/invitation-link",   protect, authorize("professor", "admin"), ctrl.generateInvitationLink);
router.get("/:cohortId/invitation-status",  protect, ctrl.getInvitationStatus);

// ─── Detail sections ──────────────────────────────────────────────────────────
router.post("/:cohortId/details/add",              protect, authorize("professor", "admin"), ctrl.addDetailSection);
router.patch("/:cohortId/details/:detailId/edit",  protect, authorize("professor", "admin"), ctrl.editDetailSection);
router.delete("/:cohortId/details/:detailId",      protect, authorize("professor", "admin"), ctrl.deleteDetailSection);

// ─── Groups ───────────────────────────────────────────────────────────────────
router.post("/:cohortId/group/create",              protect, ctrl.createGroup);
router.put("/:cohortId/group/:groupId/edit",        protect, ctrl.updateGroup);
router.delete("/:cohortId/group/:groupId/delete",   protect, ctrl.deleteGroup);
router.get("/:cohortId/group/:groupId/details",     protect, ctrl.getGroupDetails);
router.post("/:cohortId/group/:groupId/invite",     protect, ctrl.inviteGroupMember);
router.get("/:cohortId/available-members/:groupId", protect, ctrl.getAvailableMembers);

// ─── Participants ─────────────────────────────────────────────────────────────
router.post("/:cohortId/invite", protect, authorize("professor","admin"), upload.single("file"), ctrl.uploadParticipants);
router.delete("/:cohortId/participants/remove", protect, authorize("professor", "admin"), ctrl.removeParticipant);

// ─── Members ─────────────────────────────────────────────────────────────────
router.get("/:cohortId/members", protect, ctrl.getCohortMembers);

// ─── Leaderboard ─────────────────────────────────────────────────────────────
router.get("/:cohortId/leaderboard",             protect, ctrl.getLeaderboard);
router.get("/:cohortId/leaderboard/individuals", protect, ctrl.getIndividualLeaderboard);
router.get("/:cohortId/leaderboard/groups",      protect, ctrl.getGroupLeaderboard);

// ─── Grades ───────────────────────────────────────────────────────────────────

router.get("/cohorts/:cohortId/grades",               protect, ctrl.getGrades);

// ─── Submissions ─────────────────────────────────────────────────────────────
router.post("/:cohortId/submission",   protect, ctrl.submitCourseWork);
router.get("/:cohortId/submission",    protect, ctrl.getSubmission);
router.put("/:cohortId/submission",    protect, ctrl.updateSubmission);
router.delete("/:cohortId/submission", protect, ctrl.deleteSubmission);

// ─── Projects ────────────────────────────────────────────────────────────────
router.post("/:cohortId/projects/upload", protect, authorize("professor", "admin"), ctrl.uploadProjects);

export default router;