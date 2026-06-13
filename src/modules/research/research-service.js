// src/modules/research/research-service.js
import { Research, ResearchRole, ResearchApplication, ResearchUserProfile } from "./research-model.js";

// ─── Helper: format research for frontend ────────────────────────────────────
const formatResearch = (r, userId = null) => {
  const json = r.toJSON ? r.toJSON() : r;
  const myApp = userId
    ? (json.applications || []).find((a) => a.applicant_id === userId)
    : null;
  return {
    ...json,
    roles:        json.roles        || [],
    applications: json.applications || [],
    timeline:     json.timeline     || [],
    hasApplied:   !!myApp,
    applicationStatus: myApp?.status || null,
    isStarred:    myApp?.is_starred || false,
  };
};

// ─── GET /research/dashboard-sync ────────────────────────────────────────────
export const getDashboard = async (userId) => {
  const [myProjects, allProjects, myApplications] = await Promise.all([
    Research.findAll({
      where: { created_by: userId },
      include: [
        { model: ResearchRole, as: "roles" },
        { model: ResearchApplication, as: "applications" },
      ],
    }),
    Research.findAll({
      where: { status: "open" },
      include: [
        { model: ResearchRole, as: "roles" },
        { model: ResearchApplication, as: "applications" },
      ],
    }),
    ResearchApplication.findAll({ where: { applicant_id: userId } }),
  ]);

  return {
    projects:     myProjects.map((p) => formatResearch(p, userId)),
    discover:     allProjects.map((p) => formatResearch(p, userId)),
    applications: myApplications.map((a) => a.toJSON()),
  };
};

// ─── POST /research/create ────────────────────────────────────────────────────
export const createResearch = async (userId, data) => {
  const project = await Research.create({
    created_by:  userId,
    title:       data.title,
    description: data.description || null,
    type:        data.type || "research",
    status:      (data.status || "open").toLowerCase(),  // ← .toLowerCase() add karo
    start_date:  data.startDate || data.start_date || null,
    end_date:    data.endDate || data.end_date || null,
    timeline:    data.timeline || [],
    tags:        data.tags || [],
  });
  return formatResearch(project);
};

// ─── PUT /research/update/:id ─────────────────────────────────────────────────
export const updateResearch = async (id, data, userId) => {
  const project = await Research.findByPk(id);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  if (project.created_by !== userId) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }
  await project.update({
    title:       data.title       ?? project.title,
    description: data.description ?? project.description,
    status:      data.status      ?? project.status,
    start_date:  data.startDate   ?? project.start_date,
    end_date:    data.endDate     ?? project.end_date,
    tags:        data.tags        ?? project.tags,
  });
  return formatResearch(project);
};

// ─── POST /research/:id/roles/create ─────────────────────────────────────────
export const createRole = async (researchId, roleData) => {
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  const role = await ResearchRole.create({
    research_id: researchId,
    title:       roleData.title,
    description: roleData.description || null,
    vacancies:   roleData.vacancies || 1,
    skills:      roleData.skills || [],
  });
  const updated = await Research.findByPk(researchId, { include: [{ model: ResearchRole, as: "roles" }] });
  return formatResearch(updated);
};

// ─── PUT /research/:id/roles/update/:roleIndex ────────────────────────────────
export const updateRole = async (researchId, roleIndex, roleData) => {
  const roles = await ResearchRole.findAll({ where: { research_id: researchId } });
  const role = roles[roleIndex];
  if (!role) { const e = new Error("Role not found"); e.statusCode = 404; throw e; }
  await role.update({ title: roleData.title ?? role.title, description: roleData.description ?? role.description, vacancies: roleData.vacancies ?? role.vacancies });
  const updated = await Research.findByPk(researchId, { include: [{ model: ResearchRole, as: "roles" }] });
  return formatResearch(updated);
};

// ─── DELETE /research/:id/roles/delete/:roleId ────────────────────────────────
export const deleteRole = async (researchId, roleId) => {
  const role = await ResearchRole.findOne({ where: { id: roleId, research_id: researchId } });
  if (!role) { const e = new Error("Role not found"); e.statusCode = 404; throw e; }
  await role.destroy();
  const updated = await Research.findByPk(researchId, { include: [{ model: ResearchRole, as: "roles" }] });
  return formatResearch(updated);
};

// ─── GET /research/timeline/:id ───────────────────────────────────────────────
export const getTimeline = async (researchId) => {
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  return { timeline: project.timeline || [] };
};

// ─── POST /research/timeline/:id ─────────────────────────────────────────────
export const addTimelineEvent = async (researchId, eventData) => {
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  const timeline = [...(project.timeline || []), { id: Date.now(), ...eventData, date: eventData.date || new Date().toISOString() }];
  await project.update({ timeline });
  return { timeline };
};

// ─── DELETE /research/timeline/:id/:eventId ───────────────────────────────────
export const deleteTimelineEvent = async (researchId, eventId) => {
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  const timeline = (project.timeline || []).filter((e) => String(e.id) !== String(eventId));
  await project.update({ timeline });
  return { timeline };
};

// ─── PUT /research/timeline/:id/:eventId ──────────────────────────────────────
export const updateTimelineEvent = async (researchId, eventId, eventData) => {
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  const timeline = (project.timeline || []).map((e) =>
    String(e.id) === String(eventId) ? { ...e, ...eventData } : e
  );
  await project.update({ timeline });
  return { timeline };
};

// ─── POST /research/apply/:id ─────────────────────────────────────────────────
export const applyToResearch = async (researchId, applicantId, data = {}) => {
  const [app, created] = await ResearchApplication.findOrCreate({
    where: { research_id: researchId, applicant_id: applicantId },
    defaults: { role_title: data.roleTitle || null, message: data.message || null },
  });
  return { application: app.toJSON(), already_applied: !created };
};

// ─── POST /research/star/:id ──────────────────────────────────────────────────
export const starResearch = async (researchId, userId) => {
  const [app] = await ResearchApplication.findOrCreate({
    where: { research_id: researchId, applicant_id: userId },
    defaults: { is_starred: true },
  });
  await app.update({ is_starred: !app.is_starred });
  return { is_starred: app.is_starred };
};

// ─── POST /research/applications/:id/:action ─────────────────────────────────
export const handleApplication = async (applicationId, action, details = {}) => {
  const app = await ResearchApplication.findByPk(applicationId);
  if (!app) { const e = new Error("Application not found"); e.statusCode = 404; throw e; }
  const statusMap = { accept: "accepted", reject: "rejected", withdraw: "pending" };
  await app.update({ status: statusMap[action] || action, message: details.message ?? app.message });
  return { application: app.toJSON() };
};

// ─── GET /research/users ──────────────────────────────────────────────────────
// FIX: this was 404 — route was missing
export const getUsers = async () => {
  const profiles = await ResearchUserProfile.findAll({ order: [["name", "ASC"]] });
  return profiles.map((p) => p.toJSON());
};

// ─── GET /research/users/:id ──────────────────────────────────────────────────
export const getUserById = async (userId) => {
  let profile = await ResearchUserProfile.findOne({ where: { user_id: userId } });
  if (!profile) {
    // Return empty profile if not found — don't 404
    return { user_id: userId, name: "", bio: "", skills: [], avatar_url: null };
  }
  return profile.toJSON();
};

// ─── GET /research/users/profile/:id ─────────────────────────────────────────
export const getUserProfile = async (userId) => getUserById(userId);

// ─── PUT /research/users/profile/update/:id ──────────────────────────────────
export const updateUserProfile = async (userId, data) => {
  const [profile] = await ResearchUserProfile.findOrCreate({
    where: { user_id: userId },
    defaults: { name: data.name || "", email: data.email || "" },
  });
  await profile.update({
    name:      data.name      ?? profile.name,
    bio:       data.bio       ?? profile.bio,
    skills:    data.skills    ?? profile.skills,
    linkedin:  data.linkedin  ?? profile.linkedin,
    github:    data.github    ?? profile.github,
    portfolio: data.portfolio ?? profile.portfolio,
    avatar_url: data.avatarUrl ?? profile.avatar_url,
  });
  return profile.toJSON();
};