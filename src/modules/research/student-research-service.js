// src/modules/research/student-research-service.js
// Student-specific research functions
import { Research, ResearchRole, ResearchApplication, ResearchUserProfile } from "./research-model.js";
import { Op } from "sequelize";
import { formatResearch, includeOpts, buildUserNameMap } from "./research-shared.js";

// ─── Dashboard ────────────────────────────────────────────────────────────────
// GET /student/research/dashboard-sync  (same shape as prof dashboard, student-scoped data)
export const getStudentDashboard = async (studentId) => {
  const uid = String(studentId);
  const [myApplications, allOpen, userMap] = await Promise.all([
    ResearchApplication.findAll({
      where: { applicant_id: uid },
      include: [{ model: Research, as: "Research", include: includeOpts }],
    }),
    Research.findAll({ where: { status: "open" }, include: includeOpts }),
    buildUserNameMap(),
  ]);

  // starred-only records should still show in discover — only real applications block it
  const appliedIds = new Set(
    myApplications.filter(a => a.status !== "starred").map(a => String(a.research_id))
  );

  // My projects = accepted applications (exclude starred-only)
  const myProjects = myApplications
    .filter(a => a.status === "accepted" && a.Research?.type !== "Publication")
    .map(a => formatResearch(a.Research, uid, userMap));

  // My publications = accepted publication applications
  const myPublications = myApplications
    .filter(a => a.status === "accepted" && a.Research?.type === "Publication")
    .map(a => formatResearch(a.Research, uid, userMap));

  // Discover = open research not created by student, not already applied
  const discover = allOpen
    .filter(r => r.created_by !== uid && r.type !== "Publication" && !appliedIds.has(String(r.id)))
    .map(r => formatResearch(r, uid, userMap));

  const availablePublications = allOpen
    .filter(r => r.created_by !== uid && r.type === "Publication" && !appliedIds.has(String(r.id)))
    .map(r => formatResearch(r, uid, userMap));

  return {
    projects:             myProjects,
    publications:         myPublications,
    discover,
    availablePublications,
    applications:         myApplications.filter(a => a.status !== "starred").map(a => ({
      id:          a.id,
      researchId:  a.research_id,
      status:      a.status,
      appliedAt:   a.createdAt,
      itemType:    a.Research?.type === "Publication" ? "Publication" : "Project",
      title:       a.Research?.title || "Unknown",
      description: a.Research?.description || "",
      category:    a.Research?.tags?.[0] || "",
      // FIX: ApplicationsStudentView.jsx reads/searches `app.professorName` — never set.
      professorName: a.Research ? (userMap.get(String(a.Research.created_by)) || null) : null,
      // FIX: ApplicationStudentCard.jsx reads `application.justification` (the student's
      // own statement) and `application.professorNotes` (feedback from accept/reject) —
      // neither was returned here.
      justification: a.message,
      professorNotes: a.professor_notes,
    })),
  };
};

// ─── Apply ────────────────────────────────────────────────────────────────────
// POST /research/apply/:id
// FIX: ApplicationModal.jsx (student UI) submits { roleId, justification } — despite the
// name, `roleId` actually holds the role's NAME text (`<option value={role.roleName}>`),
// not a UUID. This only ever read `data.roleTitle`/`data.message`, so role_title and
// message were always null regardless of what the student picked/wrote — the real cause of
// "No justification provided.", not just a display bug.
export const applyToResearch = async (researchId, studentId, data = {}) => {
  // FIX (data integrity): applying to a non-existent researchId previously succeeded
  // silently, creating an orphan application row that later rendered as "Unknown" in the
  // applications list instead of a clear error.
  const project = await Research.findByPk(researchId);
  if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
  // FIX (functional gap): accepting an applicant never reduced the role's vacancy count or
  // closed it off, so a role with vacancies:1 kept accepting unlimited new applicants forever
  // — nothing here ever checked "is this role actually still open" before letting a student in.
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
    where: { research_id: researchId, applicant_id: String(studentId) },
    defaults: {
      role_title: data.roleTitle ?? data.roleName ?? data.roleId ?? null,
      message:    data.message   ?? data.justification            ?? null,
    },
  });
  // FIX: a row can already exist here in "starred" state (created by starResearch()
  // before the student ever applied). findOrCreate() only sets `defaults` on true
  // creation, so a starred row was found-not-created and silently kept status "starred"
  // with no role_title/message forever — the real application data was never saved and
  // the item never showed up as pending anywhere (student's list or professor's review).
  // Promote it into a real application on first apply.
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

// ─── Star ─────────────────────────────────────────────────────────────────────
// POST /research/star/:id
export const starResearch = async (researchId, studentId) => {
  // Only toggle star on existing application — never auto-create one
  const app = await ResearchApplication.findOne({
    where: { research_id: researchId, applicant_id: String(studentId) },
  });
  if (!app) {
    // FIX (data integrity): guard against starring a non-existent research id.
    const project = await Research.findByPk(researchId);
    if (!project) { const e = new Error("Research not found"); e.statusCode = 404; throw e; }
    // Student hasn't applied — create a star-only record (not a real application)
    await ResearchApplication.create({
      research_id:  researchId,
      applicant_id: String(studentId),
      is_starred:   true,
      status:       "starred",   // special status — not a real application
    });
    return { is_starred: true };
  }
  await app.update({ is_starred: !app.is_starred });
  return { is_starred: app.is_starred };
};

// ─── My Applications ──────────────────────────────────────────────────────────
// GET /student/research/my-applications
export const getMyApplications = async (studentId) => {
  const [apps, userMap] = await Promise.all([
    ResearchApplication.findAll({
      where: { applicant_id: String(studentId), status: { [Op.ne]: "starred" } },
      include: [{ model: Research, as: "Research", include: [{ model: ResearchRole, as: "roles" }] }],
    }),
    buildUserNameMap(),
  ]);
  return apps.map(a => ({
    id:          a.id,
    researchId:  a.research_id,
    status:      a.status,
    appliedAt:   a.createdAt,
    itemType:    a.Research?.type === "Publication" ? "Publication" : "Project",
    title:       a.Research?.title || "Unknown",
    description: a.Research?.description || "",
    // same missing professorName as the dashboard's applications list.
    professorName: a.Research ? (userMap.get(String(a.Research.created_by)) || null) : null,
  }));
};