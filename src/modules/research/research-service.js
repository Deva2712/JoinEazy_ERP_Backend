// src/modules/research/research-service.js
import { Research, ResearchRole, ResearchApplication, ResearchUserProfile } from "./research-model.js";

const formatResearch = (r, userId = null) => {
  const json = r.toJSON ? r.toJSON() : r;
  const myApp = userId
    ? (json.applications || []).find((a) => a.applicant_id === String(userId))
    : null;
  return {
    id:                json.id,
    title:             json.title,
    description:       json.description,
    type:              json.type,
    status:            json.status,
    startDate:         json.start_date,
    endDate:           json.end_date,
    timeline:          json.timeline || [],
    tags:              json.tags || [],
    collaborators:     json.collaborators || [],
    isStarred:         myApp?.is_starred || false,
    hasApplied:        !!myApp,
    applicationStatus: myApp?.status || null,
    isOwner:           userId ? json.created_by === String(userId) : false,
    ownerId:           json.created_by,
    roles:             json.roles || [],
    applications:      json.applications || [],
    applicants:        (json.applications || []).map(a => ({
      id:          a.id,
      applicantId: a.applicant_id,
      roleTitle:   a.role_title,
      status:      a.status,
      message:     a.message,
    })),
    // Trending/Popular ke liye metrics
    starsCount:      (json.applications || []).filter(a => a.is_starred).length,
    applicantsCount: (json.applications || []).filter(a => a.status !== "withdrawn").length,
    // trendingScore — stars + applicants dono milake, recent projects ko extra boost
    trendingScore: (() => {
      const stars     = (json.applications || []).filter(a => a.is_starred).length;
      const applicants = (json.applications || []).filter(a => a.status !== "withdrawn").length;
      const createdAt  = new Date(json.created_at || json.createdAt || 0);
      const ageInDays  = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      // recent projects (last 30 days) ko 1.5x boost
      const recencyBoost = ageInDays <= 30 ? 1.5 : 1;
      return ((stars * 2) + applicants) * recencyBoost;
    })(),
    createdAt: json.created_at || json.createdAt,
  };
};

const includeOpts = [
  { model: ResearchRole, as: "roles" },
  { model: ResearchApplication, as: "applications" },
];

// ─── GET /research/dashboard-sync ────────────────────────────────────────────
export const getDashboard = async (userId) => {
  const uid = String(userId);
  const [myResearch, allOpen, myApplications] = await Promise.all([
    Research.findAll({ where: { created_by: uid }, include: includeOpts }),
    Research.findAll({ where: { status: "open" }, include: includeOpts }),
    ResearchApplication.findAll({ where: { applicant_id: uid } }),
  ]);

  const myProjects      = myResearch.filter(r => r.type !== "Publication").map(r => formatResearch(r, uid));
  const myPublications  = myResearch.filter(r => r.type === "Publication").map(r => formatResearch(r, uid));
  const discover        = allOpen.filter(r => r.created_by !== uid && r.type !== "Publication").map(r => formatResearch(r, uid));

  return {
    projects:      myProjects,
    publications:  myPublications,
    discover,
    applications:  myApplications.map(a => a.toJSON()),
  };
};

// ─── POST /research/create ────────────────────────────────────────────────────
export const createResearch = async (userId, data) => {
  const statusMap = { "Open": "open", "Active": "active", "Completed": "completed", "On Hold": "on_hold" };
  const project = await Research.create({
    created_by:  String(userId),
    title:       data.title,
    description: data.description || null,
    type:        data.type || "research",
    status:      statusMap[data.status] || (data.status || "open").toLowerCase().replace(/\s+/g, "_"),
    start_date:  data.startDate || data.start_date || null,
    end_date:    data.endDate   || data.end_date   || null,
    timeline:    data.timeline  || [],
    tags:        data.tags      || [],
    collaborators: data.collaborators || [],
  });
  const fresh = await Research.findByPk(project.id, { include: includeOpts });
  return formatResearch(fresh, userId);
};

// ─── PUT /research/update/:id ─────────────────────────────────────────────────
export const updateResearch = async (id, data, userId) => {
  const project = await Research.findByPk(id);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  if (project.created_by !== String(userId)) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }
  await project.update({
    title:       data.title       ?? project.title,
    description: data.description ?? project.description,
    status:      data.status      ?? project.status,
    start_date:  data.startDate   ?? project.start_date,
    end_date:    data.endDate     ?? project.end_date,
    tags:        data.tags        ?? project.tags,
    collaborators: data.collaborators ?? project.collaborators,
  });
  const fresh = await Research.findByPk(id, { include: includeOpts });
  return formatResearch(fresh, userId);
};

// ─── Roles ────────────────────────────────────────────────────────────────────
export const createRole = async (researchId, roleData) => {
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  await ResearchRole.create({ research_id: researchId, title: roleData.title, description: roleData.description || null, vacancies: roleData.vacancies || 1, skills: roleData.skills || [] });
  const updated = await Research.findByPk(researchId, { include: includeOpts });
  return formatResearch(updated);
};

export const updateRole = async (researchId, roleIndex, roleData) => {
  const roles = await ResearchRole.findAll({ where: { research_id: researchId } });
  const role = roles[roleIndex];
  if (!role) { const e = new Error("Role not found"); e.statusCode = 404; throw e; }
  await role.update({ title: roleData.title ?? role.title, description: roleData.description ?? role.description, vacancies: roleData.vacancies ?? role.vacancies });
  const updated = await Research.findByPk(researchId, { include: includeOpts });
  return formatResearch(updated);
};

export const deleteRole = async (researchId, roleId) => {
  const role = await ResearchRole.findOne({ where: { id: roleId, research_id: researchId } });
  if (!role) { const e = new Error("Role not found"); e.statusCode = 404; throw e; }
  await role.destroy();
  const updated = await Research.findByPk(researchId, { include: includeOpts });
  return formatResearch(updated);
};

// ─── Timeline ─────────────────────────────────────────────────────────────────
export const getTimeline = async (researchId) => {
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  return { timeline: project.timeline || [] };
};

export const addTimelineEvent = async (researchId, eventData) => {
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  const timeline = [...(project.timeline || []), { id: Date.now(), ...eventData, date: eventData.date || new Date().toISOString() }];
  await project.update({ timeline });
  return { timeline };
};

export const deleteTimelineEvent = async (researchId, eventId) => {
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  const timeline = (project.timeline || []).filter(e => String(e.id) !== String(eventId));
  await project.update({ timeline });
  return { timeline };
};

export const updateTimelineEvent = async (researchId, eventId, eventData) => {
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  const timeline = (project.timeline || []).map(e => String(e.id) === String(eventId) ? { ...e, ...eventData } : e);
  await project.update({ timeline });
  return { timeline };
};

// ─── Applications ─────────────────────────────────────────────────────────────
export const applyToResearch = async (researchId, applicantId, data = {}) => {
  const [app, created] = await ResearchApplication.findOrCreate({
    where: { research_id: researchId, applicant_id: String(applicantId) },
    defaults: { role_title: data.roleTitle || null, message: data.message || null },
  });
  return { application: app.toJSON(), already_applied: !created };
};

export const starResearch = async (researchId, userId) => {
  const [app] = await ResearchApplication.findOrCreate({
    where: { research_id: researchId, applicant_id: String(userId) },
    defaults: { is_starred: true },
  });
  await app.update({ is_starred: !app.is_starred });

  // Updated project with new starsCount return karo
  const fresh = await Research.findByPk(researchId, { include: includeOpts });
  const formatted = fresh ? formatResearch(fresh, userId) : null;

  return {
    is_starred:  app.is_starred,
    starsCount:  formatted?.starsCount  ?? 0,
    trendingScore: formatted?.trendingScore ?? 0,
    project:     formatted,
  };
};

export const handleApplication = async (applicationId, action, details = {}) => {
  const app = await ResearchApplication.findByPk(applicationId);
  if (!app) { const e = new Error("Application not found"); e.statusCode = 404; throw e; }
  const statusMap = { accept: "accepted", reject: "rejected", withdraw: "pending" };
  await app.update({ status: statusMap[action] || action, message: details.message ?? app.message });
  return { application: app.toJSON() };
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const getUsers = async () => {
  const profiles = await ResearchUserProfile.findAll({ order: [["name", "ASC"]] });
  return profiles.map(p => p.toJSON());
};

export const getUserById = async (userId) => {
  const profile = await ResearchUserProfile.findOne({ where: { user_id: String(userId) } });
  if (!profile) return { user_id: userId, name: "", bio: "", skills: [], avatar_url: null };
  return profile.toJSON();
};

export const getUserProfile = async (userId) => getUserById(userId);

export const updateUserProfile = async (userId, data) => {
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