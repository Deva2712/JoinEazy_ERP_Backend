// src/modules/cohort/cohort-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./cohort-service.js";

export const getCohortBySlug     = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getCohortBySlug(req.params.slug) }));

export const getCohortById       = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getCohortById(req.params.cohortId) }));
export const getCohortDetails    = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getCohortDetails(req.params.cohortId, req.user.id, req.user.role) }));

export const getArchivedCohorts  = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getArchivedCohorts(req.user.id) }));
export const createCohort        = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.createCohort(req.body, { id: req.user.id, name: req.user.name }) }));
export const updateCohort        = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.updateCohort(req.params.cohortId, req.body, req.user.id) }));
export const deleteCohort        = asyncHandler(async (req, res) => { await svc.deleteCohort(req.params.cohortId, req.user.id); res.json({ success: true, message: "Cohort deleted" }); });
export const archiveCohort       = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.archiveCohort(req.params.cohortId, req.user.id) }));
export const checkExpired        = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.checkAndArchiveExpired() }));

export const addDetailSection    = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.addDetailSection(req.params.cohortId, req.body) }));
export const editDetailSection   = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.editDetailSection(req.params.cohortId, req.params.detailId, req.body) }));
export const deleteDetailSection = asyncHandler(async (req, res) => { await svc.deleteDetailSection(req.params.cohortId, req.params.detailId); res.json({ success: true, message: "Section deleted" }); });

export const createGroup         = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.createGroup(req.params.cohortId, req.body, { id: req.user.id, email: req.user.email }) }));
export const updateGroup         = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.updateGroup(req.params.cohortId, req.params.groupId, req.body, req.user.id) }));
export const deleteGroup         = asyncHandler(async (req, res) => { await svc.deleteGroup(req.params.cohortId, req.params.groupId, req.user.id, req.user.role); res.json({ success: true, message: "Group deleted" }); });
export const getGroupDetails     = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getGroupDetails(req.params.cohortId, req.params.groupId) }));
export const inviteGroupMember   = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.inviteGroupMember(req.params.cohortId, req.params.groupId, req.body) }));
export const acceptGroupInvite   = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.acceptGroupInvite(req.body.token, req.user.id, req.user.email) }));
export const removeGroupMember   = asyncHandler(async (req, res) => { await svc.removeGroupMember(req.params.groupId, req.body.targetUserId); res.json({ success: true, message: "Member removed" }); });
export const addMembersToGroup   = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.addMembersToGroup(req.params.groupId, req.body.memberUserIds) }));
export const getAvailableMembers = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getAvailableMembers(req.params.cohortId, req.params.groupId) }));

export const generateInvitationLink = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.generateInvitationLink(req.params.cohortId, req.user.id) }));
export const getInvitationInfo      = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getInvitationInfo(req.query.token) }));
export const joinWithInvitation     = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.joinWithInvitation(req.body.token, { id: req.user?.id, email: req.body.email, name: req.body.name }) }));

export const uploadParticipants  = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.uploadParticipants(req.params.cohortId, req.body.participants || []) }));
export const removeParticipant   = asyncHandler(async (req, res) => { await svc.removeParticipant(req.params.cohortId, req.body.targetUserId); res.json({ success: true, message: "Participant removed" }); });
export const getCohortMembers    = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getCohortMembers(req.params.cohortId) }));

export const getLeaderboard          = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getLeaderboard(req.params.cohortId) }));
export const getIndividualLeaderboard= asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getIndividualLeaderboard(req.params.cohortId) }));
export const getGroupLeaderboard     = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getGroupLeaderboard(req.params.cohortId) }));

// Submissions (course-level file submissions)
export const submitCourseWork  = asyncHandler(async (req, res) => res.status(201).json({ success: true, message: "Submitted" }));
export const getSubmission     = asyncHandler(async (req, res) => res.json({ success: true, data: null }));
export const updateSubmission  = asyncHandler(async (req, res) => res.json({ success: true, message: "Updated" }));
export const deleteSubmission  = asyncHandler(async (req, res) => res.json({ success: true, message: "Deleted" }));

// Grade assignments
export const gradeAssignment      = asyncHandler(async (req, res) => res.json({ success: true, message: "Graded" }));
export const gradeGroupAssignment = asyncHandler(async (req, res) => res.json({ success: true, message: "Group graded" }));

export const getGrades            = asyncHandler(async (req, res) => res.json({ success: true, data: [] }));
export const uploadProjects       = asyncHandler(async (req, res) => res.json({ success: true, message: "Projects uploaded" }));
export const getInvitationStatus  = asyncHandler(async (req, res) => res.json({ success: true, data: { email: req.query.email, status: "pending" } }));