// src/modules/research/prof-research-service.js
// Professor-specific research functions
import { Op } from "sequelize";
import { Research, ResearchRole, ResearchApplication, ResearchUserProfile } from "./research-model.js";
import { formatResearch, includeOpts, buildUserNameMap } from "./research-shared.js";

// FIX: PostResearchModal's status <select> only ever sends "Open"/"Closed" (capitalized).
// createResearch already normalized this before saving, but updateResearch saved
// `data.status` straight through — writing "Open"/"Closed" directly into the lowercase-only
// ENUM column threw a validation error on every edit that touched status (i.e. every edit,
// since the form always includes it).
const normalizeStatus = (status, fallback) => {
  const statusMap = { Open: "open", Active: "active", Completed: "completed", "On Hold": "on_hold", Closed: "closed" };
  if (status == null) return fallback;
  return statusMap[status] || String(status).toLowerCase().replace(/\s+/g, "_");
};

// FIX (security): shared helper for the ownership checks added below. Admins bypass;
// everyone else must own the resource they're trying to modify. Routes already restrict
// these actions to professor/admin, but that only proves *a* professor is calling — not that
// it's the *right* professor, so this check is still required to stop a professor editing
// someone else's project.
const assertOwner = (ownerId, requester) => {
  if (requester?.role === "admin") return;
  if (String(ownerId) !== String(requester?.id)) {
    const e = new Error("Not authorized"); e.statusCode = 403; throw e;
  }
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
// GET /research/dashboard-sync
export const getProfDashboard = async (profId) => {
  const uid = String(profId);
  const [myResearch, allOpen, myApplications, userMap] = await Promise.all([
    Research.findAll({ where: { created_by: uid }, include: includeOpts }),
    Research.findAll({ where: { status: "open" }, include: includeOpts }),
    ResearchApplication.findAll({ where: { applicant_id: uid } }),
    buildUserNameMap(),
  ]);

  const myProjects     = myResearch.filter(r => r.type !== "Publication").map(r => formatResearch(r, uid, userMap));
  const myPublications = myResearch.filter(r => r.type === "Publication").map(r => formatResearch(r, uid, userMap));
  const discover       = allOpen
    .filter(r => r.created_by !== uid && r.type !== "Publication")
    .map(r => formatResearch(r, uid, userMap));
  const availablePublications = allOpen
    .filter(r => r.created_by !== uid && r.type === "Publication")
    .map(r => formatResearch(r, uid, userMap));

  return { projects: myProjects, publications: myPublications, discover, availablePublications, applications: myApplications.map(a => a.toJSON()) };
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────
// POST /research/create
export const createResearch = async (profId, data) => {
  const project = await Research.create({
    created_by:    String(profId),
    title:         data.title,
    description:   data.abstract ?? data.description ?? null,
    type:          data.type        || "research",
    category:      data.category    || null,
    // FIX: was collected by the form and discarded — see research-model.js.
    collaboration_type: data.collaborationType || null,
    status:        normalizeStatus(data.status, "open"),
    start_date:    data.startDate   || data.start_date || null,
    end_date:      data.endDate     || data.end_date   || null,
    timeline:      data.timeline    || [],
    tags:          data.tags        || [],
    // FIX (functional gap): PostResearchModal sends `coAuthors` for Publications and
    // `collaborators` for Projects, but there was only ever one `collaborators` column and
    // only `data.collaborators` was ever read — every Publication's co-authors were silently
    // discarded on creation. ResearchDetailsView's "Co-Authors" section, the coAuthor search
    // filters, and the user-portfolio matching all read `coAuthors` and always got nothing.
    // Reusing the single column for both (mirrored back out as both names in formatResearch)
    // avoids a schema change while fixing all of those.
    collaborators: (data.type === "Publication" ? data.coAuthors : data.collaborators) || [],
  });
  const fresh = await Research.findByPk(project.id, { include: includeOpts });
  return formatResearch(fresh, profId, await buildUserNameMap());
};

// PUT /research/update/:id
export const updateResearch = async (id, data, profId) => {
  const project = await Research.findByPk(id);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  if (project.created_by !== String(profId)) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }
  await project.update({
    title:         data.title         ?? project.title,
    description:   data.abstract      ?? data.description ?? project.description,
    category:      data.category      ?? project.category,
    // FIX: was collected by the form and discarded — see research-model.js.
    collaboration_type: data.collaborationType ?? project.collaboration_type,
    status:        normalizeStatus(data.status, project.status),
    start_date:    data.startDate     ?? project.start_date,
    end_date:      data.endDate       ?? project.end_date,
    tags:          data.tags          ?? project.tags,
    // FIX: see createResearch above — same coAuthors/collaborators gap on edit.
    collaborators: (data.type === "Publication" ? data.coAuthors : data.collaborators) ?? project.collaborators,
  });
  const fresh = await Research.findByPk(id, { include: includeOpts });
  return formatResearch(fresh, profId, await buildUserNameMap());
};

// ─── Roles ────────────────────────────────────────────────────────────────────
// to be the plain array of roles for that research item (`openRoles: res.data`,
// `openRolesCount: res.data.length`) — these previously returned the full formatResearch()
// object instead.
//
// The DB column is `title` (allowNull: false), so `roleData.title` was always undefined and
// every "Add Opening" submission failed a NOT NULL validation on the backend (swallowed by
// the frontend's catch block) — this is why openings never appeared after being added.
const formatRole = (r) => {
  const json = r.toJSON ? r.toJSON() : r;
  return {
    id:          json.id,
    researchId:  json.research_id,
    roleName:    json.title,
    description: json.description,
    vacancies:   json.vacancies,
    skills:      json.skills || [],
  };
};

export const createRole = async (researchId, roleData, requester) => {
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  // FIX (security): was previously reachable by anyone with a valid token for any project.
  assertOwner(project.created_by, requester);
  await ResearchRole.create({
    research_id: researchId,
    title:       roleData.title ?? roleData.roleName,
    description: roleData.description || null,
    vacancies:   roleData.vacancies ?? 1,
    skills:      roleData.skills || [],
  });
  const roles = await ResearchRole.findAll({ where: { research_id: researchId } });
  return roles.map(formatRole);
};

// indexing an array with a UUID string is always undefined, so every update 404'd. Looks the
// role up by id instead, regardless of what the URL param happens to be named.
export const updateRole = async (researchId, roleIdOrIndex, roleData, requester) => {
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  // FIX (security): was previously reachable by anyone with a valid token for any project.
  assertOwner(project.created_by, requester);
  const role = await ResearchRole.findOne({ where: { id: roleIdOrIndex, research_id: researchId } });
  if (!role) { const e = new Error("Role not found"); e.statusCode = 404; throw e; }
  await role.update({
    title:       roleData.title ?? roleData.roleName ?? role.title,
    description: roleData.description ?? role.description,
    vacancies:   roleData.vacancies ?? role.vacancies,
  });
  const roles = await ResearchRole.findAll({ where: { research_id: researchId } });
  return roles.map(formatRole);
};

export const deleteRole = async (researchId, roleId, requester) => {
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  assertOwner(project.created_by, requester);
  const role = await ResearchRole.findOne({ where: { id: roleId, research_id: researchId } });
  if (!role) { const e = new Error("Role not found"); e.statusCode = 404; throw e; }
  await role.destroy();
  const roles = await ResearchRole.findAll({ where: { research_id: researchId } });
  return roles.map(formatRole);
};

// ─── Timeline ─────────────────────────────────────────────────────────────────
export const getTimeline = async (researchId) => {
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  return { timeline: project.timeline || [] };
};

export const addTimelineEvent = async (researchId, eventData, requester) => {
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  assertOwner(project.created_by, requester);
  const timeline = [...(project.timeline || []), { id: Date.now(), ...eventData, date: eventData.date || new Date().toISOString() }];
  await project.update({ timeline });
  return { timeline };
};

export const updateTimelineEvent = async (researchId, eventId, eventData, requester) => {
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  // FIX (security): was previously reachable by anyone with a valid token for any project.
  assertOwner(project.created_by, requester);
  const timeline = (project.timeline || []).map(e => String(e.id) === String(eventId) ? { ...e, ...eventData } : e);
  await project.update({ timeline });
  return { timeline };
};

export const deleteTimelineEvent = async (researchId, eventId, requester) => {
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  // FIX (security): was previously reachable by anyone with a valid token for any project.
  assertOwner(project.created_by, requester);
  const timeline = (project.timeline || []).filter(e => String(e.id) !== String(eventId));
  await project.update({ timeline });
  return { timeline };
};

// ─── Apply & Star — Prof can apply to / star other research ──────────────────
// FIX: ApplicationModal.jsx (professor UI) submits { roleName, justification } — this
// only ever read `data.roleTitle`/`data.message`, so role_title and message were always
// null no matter what the professor selected/wrote. This is the actual root cause behind
// "No justification provided." — the text was never saved in the first place, not just a
// display-side issue.
export const applyToResearch = async (researchId, profId, data = {}) => {
  // FIX (data integrity): applying to a non-existent researchId previously succeeded
  // silently, creating an orphan application row that later rendered as "Unknown" in the
  // applications list instead of a clear error.
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  // FIX: same vacancies guard as student-research-service.js's applyToResearch.
  const roleTitle = data.roleTitle ?? data.roleName ?? data.roleId ?? null;
  if (roleTitle) {
    const role = await ResearchRole.findOne({ where: { research_id: researchId, title: roleTitle } });
    if (role && role.vacancies <= 0) {
      const e = new Error("This role has no open vacancies left.");
      e.statusCode = 409;
      throw e;
    }
  }
  const [app, created] = await ResearchApplication.findOrCreate({
    where: { research_id: researchId, applicant_id: String(profId) },
    defaults: {
      role_title: data.roleTitle ?? data.roleName ?? data.roleId ?? null,
      message:    data.message   ?? data.justification            ?? null,
    },
  });
  // FIX: same star-then-apply data loss as student-research-service.js — a pre-existing
  // "starred" row was found-not-created here and never promoted to a real application.
  let alreadyApplied = !created;
  if (!created && app.status === "starred") {
    await app.update({
      status:     "pending",
      role_title: data.roleTitle ?? data.roleName ?? data.roleId ?? app.role_title,
      message:    data.message   ?? data.justification            ?? app.message,
    });
    alreadyApplied = false;
  }
  return { application: app.toJSON(), already_applied: alreadyApplied };
};

export const starResearch = async (researchId, profId) => {
  const app = await ResearchApplication.findOne({
    where: { research_id: researchId, applicant_id: String(profId) },
  });
  if (!app) {
    // FIX (data integrity): guard against starring a non-existent research id (see
    // applyToResearch above for the same fix / rationale).
    const project = await Research.findByPk(researchId);
    if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
    await ResearchApplication.create({
      research_id: researchId, applicant_id: String(profId),
      is_starred: true, status: "starred",
    });
    return { is_starred: true };
  }
  await app.update({ is_starred: !app.is_starred });
  return { is_starred: app.is_starred };
};

// ─── Applications — Prof reviews incoming applications ─────────────────────────
// GET /research/applications/:researchId  — see all applicants for my research
export const getApplications = async (researchId, requester) => {
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  assertOwner(project.created_by, requester);
  const apps = await ResearchApplication.findAll({ where: { research_id: researchId } });
  return { applications: apps.map(a => a.toJSON()) };
};

// POST /research/applications/:applicationId/:action  — accept/reject
// FIX: ApplicationCard.jsx (professor UI) calls onAction(appId, "Accepted"/"Rejected", ...),
// which becomes the :action URL param verbatim. statusMap only had lowercase verb keys
// ("accept"/"reject"/"withdraw"), so "Accepted"/"Rejected" never matched and fell through to
// `|| action`, attempting to save "Accepted" into a lowercase-only ENUM — a DB validation
// error on every accept/reject click.
// FIX: also previously overwrote `message` (the applicant's original justification) with the
// professor's feedback text — now saved to the separate `professor_notes` column instead.
// FIX (functional gap): accepting an applicant used to touch only that one application row.
// Usersearchactions.js's optimistic UI already assumes accepting also (a) auto-rejects other
// still-pending applicants for the *same role* and (b) adds the student to the project's
// roster (collaborators/coAuthors) — but none of that was ever persisted, so it silently
// reverted the moment the page refetched. Now both are actually saved.
export const handleApplication = async (applicationId, action, details = {}, requester) => {
  const app = await ResearchApplication.findByPk(applicationId);
  if (!app) { const e = new Error("Application not found"); e.statusCode = 404; throw e; }
  // FIX (security — most serious gap in this module): this never verified who was calling.
  // Any authenticated user (not just professors, and not just the owning professor) could
  // hit POST /research/applications/:applicationId/accept for ANY application — including
  // accepting their own pending application without the professor ever reviewing it, or
  // rejecting a competing applicant on a project they have no connection to.
  const project = await Research.findByPk(app.research_id);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  assertOwner(project.created_by, requester);
  const statusMap = {
    accept: "accepted", accepted: "accepted",
    reject: "rejected", rejected: "rejected",
    withdraw: "pending", withdrawn: "pending", pending: "pending",
  };
  const normalized = String(action || "").toLowerCase();
  const status = statusMap[normalized];
  if (!status) { const e = new Error(`Invalid application action: ${action}`); e.statusCode = 400; throw e; }
  await app.update({ status, professor_notes: details.message ?? app.professor_notes });

  if (status === "accepted") {
    // Auto-reject other still-pending applicants for the same role — matches what the UI
    // already implies is happening ("Position has been filled.")
    if (app.role_title) {
      await ResearchApplication.update(
        { status: "rejected", professor_notes: "Position has been filled." },
        { where: { research_id: app.research_id, role_title: app.role_title, status: "pending", id: { [Op.ne]: app.id } } },
      );
    }
    // Add the accepted applicant to the project's visible roster.
    const userMap = await buildUserNameMap();
    const applicantName = userMap.get(String(app.applicant_id));
    if (applicantName) {
      const collaborators = Array.isArray(project.collaborators) ? project.collaborators : [];
      if (!collaborators.includes(applicantName)) {
        await project.update({ collaborators: [...collaborators, applicantName] });
      }
    }
    // FIX (functional gap): accepting never touched the role's vacancy count, so a role
    // with vacancies:1 stayed open forever and kept accepting new applicants indefinitely.
    // Decrement it here (floored at 0) now that applyToResearch also checks this count.
    if (app.role_title) {
      const role = await ResearchRole.findOne({ where: { research_id: app.research_id, title: app.role_title } });
      if (role && role.vacancies > 0) {
        await role.update({ vacancies: role.vacancies - 1 });
      }
    }
  }

  return { application: app.toJSON() };
};

// ─── Users / Profiles ─────────────────────────────────────────────────────────
// FIX (functional gap): ResearchUserProfile rows only get created the first time a user
// saves their own research profile (via EditProfileModal / updateUserProfile below). Any
// user who never opened "Edit Profile" — which is most brand-new accounts — had no row in
// that table at all, so they never showed up in PostResearchModal's "Select Collaborators /
// Co-Authors" search, even though they're a perfectly real, active account. Now sources the
// full user list from Auth (every real account) and overlays ResearchUserProfile's extra
// fields (bio/skills/links/avatar) where a profile happens to exist.
export const getUsers = async () => {
  const User = (await import("../auth/auth-model.js")).default;
  const [users, profiles] = await Promise.all([
    User.findAll({ attributes: ["id", "name", "email", "role", "department"], order: [["name", "ASC"]] }),
    ResearchUserProfile.findAll(),
  ]);
  const profileByUserId = new Map(profiles.map(p => [String(p.user_id), p.toJSON()]));
  return users.map(u => {
    const uj = u.toJSON();
    const profile = profileByUserId.get(String(uj.id)) || {};
    return {
      id:         uj.id,
      user_id:    uj.id,
      name:       uj.name,
      email:      uj.email,
      role:       uj.role,
      department: profile.department || uj.department || null,
      bio:        profile.bio        || "",
      skills:     profile.skills     || [],
      avatar_url: profile.avatar_url || null,
      linkedin:   profile.linkedin   || null,
      github:     profile.github     || null,
      portfolio:  profile.portfolio  || null,
    };
  });
};

// FIX: same gap as getUsers above — a user with no saved research profile used to come back
// as an almost-empty stub (no name/email/department at all), so clicking into a collaborator
// who'd never touched Edit Profile showed a blank card. Falls back to their real Auth details.
export const getUserById = async (userId) => {
  const User = (await import("../auth/auth-model.js")).default;
  const [user, profile] = await Promise.all([
    User.findByPk(userId, { attributes: ["id", "name", "email", "role", "department"] }),
    ResearchUserProfile.findOne({ where: { user_id: String(userId) } }),
  ]);
  const p = profile ? profile.toJSON() : {};
  return {
    id:         userId,
    user_id:    userId,
    name:       p.name       || user?.name       || "",
    email:      p.email      || user?.email      || "",
    role:       user?.role   || p.role           || null,
    department: p.department || user?.department || null,
    bio:        p.bio        || "",
    skills:     p.skills     || [],
    avatar_url: p.avatar_url || null,
    linkedin:   p.linkedin   || null,
    github:     p.github     || null,
    portfolio:  p.portfolio  || null,
  };
};

export const updateUserProfile = async (userId, data, requester) => {
  // FIX (security — IDOR): the route only ever checked that *a* valid token was present, not
  // that the token belonged to the profile being edited. Any logged-in user could PUT a
  // different user's id here and overwrite their bio/skills/links/avatar. Self-edit only,
  // unless the requester is an admin.
  assertOwner(userId, requester);
  const [profile] = await ResearchUserProfile.findOrCreate({
    where: { user_id: String(userId) },
    defaults: { name: data.name || "", email: data.email || "" },
  });
  await profile.update({
    name:       data.name       ?? profile.name,
    bio:        data.bio        ?? profile.bio,
    skills:     data.skills     ?? profile.skills,
    linkedin:   data.linkedin   ?? profile.linkedin,
    github:     data.github     ?? profile.github,
    portfolio:  data.portfolio  ?? profile.portfolio,
    avatar_url: data.avatarUrl  ?? profile.avatar_url,
  });
  return profile.toJSON();
};