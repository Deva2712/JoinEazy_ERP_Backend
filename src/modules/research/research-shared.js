// src/modules/research/research-shared.js
// Shared formatters used by both prof and student services
import { ResearchRole, ResearchApplication } from "./research-model.js";

export const includeOpts = [
  { model: ResearchRole,        as: "roles"        },
  { model: ResearchApplication, as: "applications" },
];

// FIX: professorName / applicant names were never resolved anywhere. Build a single
// id -> name map (from the Auth model, which every user has, unlike the optional
// ResearchUserProfile) once per request and thread it through formatResearch.
export const buildUserNameMap = async () => {
  const User = (await import("../auth/auth-model.js")).default;
  const users = await User.findAll({ attributes: ["id", "name"] });
  return new Map(users.map(u => [String(u.id), u.name]));
};

// FIX: DB stores status lowercase ("open"/"active"/"completed"/"on_hold"/"closed"), but
// every frontend comparison (ResearchCard, ResearchDetailsView, ResearchDetailsStudentView,
// filter sidebars, on both the professor and student sides) checks `status === "Open"`
// (capitalized). Converting to display case here fixes all of those checks in one place.
const STATUS_DISPLAY = { open: "Open", active: "Active", completed: "Completed", on_hold: "On Hold", closed: "Closed" };

// FIX: same problem as STATUS_DISPLAY above, but for each applicant's review status. The DB
// enum is lowercase ("pending"/"accepted"/"rejected"/"starred"), but ApplicationCard.jsx only
// renders the Accept/Reject footer when `applicant.status === "Pending"` (capitalized), and
// Usersearchactions.js's optimistic-update logic makes the same capitalized comparison. With
// the raw lowercase value, that condition was never true — the review buttons never appeared
// for professors on the "Received Applications" tab.
const APP_STATUS_DISPLAY = { pending: "Pending", accepted: "Accepted", rejected: "Rejected", starred: "Starred" };

export const formatResearch = (r, userId = null, userMap = null) => {
  if (!r) return null;
  const json       = r.toJSON ? r.toJSON() : r;
  const myApp      = userId
    ? (json.applications || []).find(a => a.applicant_id === String(userId))
    : null;
  const starsCount = (json.applications || []).filter(a => a.is_starred).length;
  const professorName = userMap?.get(String(json.created_by)) || null;

  return {
    id:                json.id,
    title:             json.title,
    description:       json.description,
    // FIX: ResearchCard/ResearchDetailsView badge falls back to "General" whenever
    // `item.category` is falsy — was never returned even after the column above was added.
    category:          json.category || "",
    // FIX: see research-model.js — collaboration_type was never persisted before, so this
    // was always missing. Now returned to match what ResearchFilterSidebar filters on.
    collaborationType: json.collaboration_type || "",
    type:              json.type,
    status:            STATUS_DISPLAY[json.status] || json.status,
    startDate:         json.start_date,
    endDate:           json.end_date,
    timeline:          json.timeline      || [],
    tags:              json.tags          || [],
    collaborators:     json.collaborators || [],
    // FIX: see prof-research-service.js createResearch/updateResearch — Publications' authors
    // are stored in the same `collaborators` column (no separate coAuthors column exists), so
    // mirror it out under the name the frontend actually reads for publications.
    coAuthors:         json.collaborators || [],
    isStarred:         myApp?.is_starred  || false,
    starsCount,
    isTrending:        starsCount >= 3,
    hasApplied:        !!myApp,
    applicationStatus: myApp?.status      || null,
    isOwner:           userId ? json.created_by === String(userId) : false,
    ownerId:           json.created_by,
    professorName,
    ownerName:         professorName,
    openRoles:         (json.roles || []).map(role => ({
      id:          role.id,
      researchId:  role.research_id,
      roleName:    role.title,
      description: role.description,
      vacancies:   role.vacancies,
      skills:      role.skills || [],
    })),
    openRolesCount:    (json.roles || []).length,
    applicants: (json.applications || []).map(a => ({
      id:            a.id,
      applicantId:   a.applicant_id,
      userId:        a.applicant_id,
      name:          userMap?.get(String(a.applicant_id)) || null,
      roleTitle:     a.role_title,
      role:          a.role_title,
      status:        APP_STATUS_DISPLAY[a.status] || a.status,
      message:       a.message,
      justification: a.message,
      professorNotes: a.professor_notes,
      appliedDate:   a.createdAt || a.created_at,
      createdAt:     a.createdAt || a.created_at,
      isStarred:     a.is_starred,
    })),
    createdAt: json.created_at || json.createdAt,
  };
};