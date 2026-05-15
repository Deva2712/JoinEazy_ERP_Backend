import express from "express";
import * as ctrl from "./cohort-controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

/**
 * All cohort management routes require authentication.
 */
router.use(protect);

// --- Core Cohort Management ---
router.get("/", ctrl.listActive);
router.get("/archived", ctrl.listArchived);
router.get("/slug/:slug", ctrl.getMetadataBySlug);
router.get("/invitation-info", ctrl.getInvitationInfo);
router.get("/:cohortId/details", ctrl.getDetails);
router.get("/:cohortId/members", ctrl.getMembers);
router.post("/create", ctrl.create);
router.patch("/edit/:cohortId", ctrl.update);
router.delete("/:cohortId", ctrl.removeCohort);
router.post("/join-with-invitation", ctrl.joinByInvite);
router.post("/:cohortId/invitation-link", ctrl.generateInviteLink);
router.post("/:cohortId/archive", ctrl.archive);
router.post("/check-expired", ctrl.processExpiredCohorts);

// --- Participant & Group Management ---
router.post("/:cohortId/invite", ctrl.uploadParticipants); // Excel upload
router.delete("/:cohortId/participants/remove", ctrl.removeParticipant);
router.get("/:cohortId/available-members/:groupId", ctrl.getAvailableForGroup);

router.get("/group/:groupId/details", ctrl.getGlobalGroupDetails);
router.get("/:cohortId/group/:groupId/details", ctrl.getGroupDetails);
router.post("/:cohortId/group/create", ctrl.createGroup);
router.put("/:cohortId/group/:groupId/edit", ctrl.updateGroup);
router.delete("/:cohortId/group/:groupId/delete", ctrl.deleteGroup);
router.post("/:cohortId/group/:groupId/invite", ctrl.inviteToGroup);
router.post("/group/accept-invite", ctrl.acceptGroupInvite);
router.delete("/group/:groupId/remove-member", ctrl.removeGroupMember);
router.post("/group/:groupId/add-members", ctrl.addMembersToGroup);

// --- Assignment Management ---
router.get("/:cohortId/assignments", ctrl.getAssignments);
router.post("/:cohortId/assignments", ctrl.createAssignment);
router.put("/:cohortId/assignments/:assignmentId", ctrl.updateAssignment);
router.delete("/:cohortId/assignments/:assignmentId", ctrl.deleteAssignment);

// --- Grading & Visibility ---
router.get("/cohorts/:cohortId/grades", ctrl.getGrades);
router.post("/assignments/:assignmentId/grade", ctrl.gradeIndividual);
router.post("/assignments/:assignmentId/grade-group", ctrl.gradeGroup);
router.patch(
	"/:cohortId/assignments/visibility/bulk",
	ctrl.updateBulkVisibility,
);
router.patch(
	"/:cohortId/assignments/:assignmentId/visibility",
	ctrl.updateVisibility,
);

// --- Submissions ---
router.get("/:cohortId/submission", ctrl.getSubmission); // For students
router.post("/:cohortId/submission", ctrl.postSubmission);
router.put("/:cohortId/submission", ctrl.updateSubmission);
router.delete("/:cohortId/submission", ctrl.deleteSubmission);
router.get(
	"/:cohortId/assignments/:assignmentId/submissions",
	ctrl.getAssignmentSubmissions,
); // For professors
router.get(
	"/:cohortId/assignments/submissions/status",
	ctrl.getSubmissionStatus,
);
router.post(
	"/:cohortId/assignments/:assignmentId/submit",
	ctrl.markAsSubmitted,
);
router.delete(
	"/:cohortId/assignments/:assignmentId/submit",
	ctrl.unmarkAsSubmitted,
);

// --- Materials & Academic Details ---
router.get("/:cohortId/materials", ctrl.getMaterials);
router.post("/:cohortId/materials", ctrl.createMaterial);
router.put("/:cohortId/materials/:materialId", ctrl.updateMaterial);
router.delete("/:cohortId/materials/:materialId", ctrl.deleteMaterial);

router.post("/:cohortId/details/add", ctrl.addDetailSection);
router.patch("/:cohortId/details/:detailId/edit", ctrl.editDetailSection);
router.delete("/:cohortId/details/:detailId", ctrl.deleteDetailSection);

// --- Week-based Resources ---
router.get("/:cohortId/resources", ctrl.getResources);
router.post("/:cohortId/resources/week", ctrl.createWeek);
router.put("/:cohortId/resources/week/:weekId", ctrl.updateWeek);
router.delete("/:cohortId/resources/week/:weekId", ctrl.deleteWeek);

router.post("/:cohortId/resources/week/:weekId", ctrl.createResource); // Specific resource in week
router.put("/:cohortId/resources/:resourceId", ctrl.updateResource);
router.delete("/:cohortId/resources/:resourceId", ctrl.deleteResource);
router.post("/:cohortId/projects/upload", ctrl.uploadProjects);

export default router;
