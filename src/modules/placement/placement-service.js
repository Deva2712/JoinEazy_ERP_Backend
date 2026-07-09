// src/modules/placement/placement-service.js
import { Op } from "sequelize";
import { PlacementJob, PlacementApplication, PlacementDocument, PlacementHistory } from "./placement-model.js";
import { uploadToS3 } from "../../middleware/upload.middleware.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatJob = (job) => {
  const j = job.toJSON ? job.toJSON() : job;
  return {
    id:           j.id,
    role:         j.role,
    company:      j.company,
    location:     j.location || "—",
    type:         j.type,
    package:      j.package || null,
    stipend:      j.stipend || null,
    description:  j.description || "",
    requirements: j.requirements || [],
    rounds:       j.rounds || [],
    deadline:     j.deadline,
    is_active:    j.is_active,
    created_at:   j.created_at,
  };
};

const formatApplication = (app, job = null) => {
  const a = app.toJSON ? app.toJSON() : app;
  const j = job || a.job || {};
  return {
    id:           a.id,
    jobId:        a.job_id,
    role:         j.role  || a.role  || "Position",
    company:      j.company || a.company || "Company",
    type:         j.type  || a.type  || "Full Time",
    location:     j.location || "—",
    package:      j.package || null,
    rounds:       j.rounds  || [],
    description:  j.description || "",
    status:       a.status,
    appliedAt:    a.created_at,
    interviewDate: a.interview_date || null,
    interviewTime: a.interview_time || null,
    interviewMode: a.interview_mode || null,
    onlineLink:    a.online_link    || null,
    venue:         a.venue          || null,
    guidelines:    a.guidelines     || [],
    documentsRequired: a.documents_required || [],
    notes:         a.notes || null,
  };
};

const formatHistory = (h) => {
  const r = h.toJSON ? h.toJSON() : h;
  return {
    id:      r.id,
    role:    r.role,
    company: r.company,
    year:    r.year,
    package: r.package,
    type:    r.type,
    notes:   r.notes,
  };
};

// ── Jobs ──────────────────────────────────────────────────────────────────────

export const getJobs = async () => {
  const jobs = await PlacementJob.findAll({
    where: { is_active: true },
    order: [["created_at", "DESC"]],
  });
  return jobs.map(formatJob);
};

export const getJobById = async (jobId) => {
  const job = await PlacementJob.findByPk(jobId);
  if (!job) { const e = new Error("Job not found"); e.statusCode = 404; throw e; }
  return formatJob(job);
};

export const createJob = async (data) => {
  const job = await PlacementJob.create({
    role:         data.role,
    company:      data.company,
    location:     data.location   || null,
    type:         data.type       || "Full Time",
    package:      data.package    || null,
    stipend:      data.stipend    || null,
    description:  data.description|| null,
    requirements: data.requirements || [],
    rounds:       data.rounds     || [],
    deadline:     data.deadline   || null,
    created_by:   data.createdBy  || null,
  });
  return formatJob(job);
};

export const updateJob = async (jobId, data) => {
  const job = await PlacementJob.findByPk(jobId);
  if (!job) { const e = new Error("Job not found"); e.statusCode = 404; throw e; }
  await job.update(data);
  return formatJob(job);
};

export const deleteJob = async (jobId) => {
  const job = await PlacementJob.findByPk(jobId);
  if (!job) { const e = new Error("Job not found"); e.statusCode = 404; throw e; }
  await job.update({ is_active: false });
  return { message: "Job removed" };
};

// ── Applications ──────────────────────────────────────────────────────────────

export const getApplications = async (studentId) => {
  const apps = await PlacementApplication.findAll({
    where: { student_id: String(studentId) },
    include: [{ model: PlacementJob, as: "job" }],
    order: [["created_at", "DESC"]],
  });
  return apps.map((a) => formatApplication(a, a.job));
};

export const getApplicationById = async (applicationId, studentId) => {
  const app = await PlacementApplication.findOne({
    where: { id: applicationId, student_id: String(studentId) },
    include: [{ model: PlacementJob, as: "job" }],
  });
  if (!app) { const e = new Error("Application not found"); e.statusCode = 404; throw e; }
  return formatApplication(app, app.job);
};

export const applyToJob = async (studentId, jobId, formData) => {
  // Job exist karta hai check karo
  const job = await PlacementJob.findOne({ where: { id: jobId, is_active: true } });
  if (!job) { const e = new Error("Job not found or no longer active"); e.statusCode = 404; throw e; }

  // Duplicate application check
  const existing = await PlacementApplication.findOne({
    where: { student_id: String(studentId), job_id: jobId },
  });
  if (existing) { const e = new Error("Already applied to this job"); e.statusCode = 409; throw e; }

  const app = await PlacementApplication.create({
    student_id:   String(studentId),
    job_id:       jobId,
    full_name:    formData.fullName   || formData.full_name   || "",
    email:        formData.email      || "",
    phone:        formData.phone      || null,
    roll_number:  formData.rollNumber || formData.roll_number || null,
    branch:       formData.branch     || null,
    year:         formData.year       || null,
    cgpa:         formData.cgpa       || null,
    why_company:  formData.whyCompany || formData.why_company || null,
    strengths:    formData.strengths  || null,
    experience:   formData.experience || null,
    availability: formData.availability || null,
    linked_in:    formData.linkedIn   || formData.linked_in   || null,
    portfolio:    formData.portfolio  || null,
    cover_letter: formData.coverLetter|| formData.cover_letter|| null,
    resume_url:   formData.resumeUrl  || formData.resume_url  || null,
    notes:        formData.notes      || null,
    status:       "Applied",
  });

  return formatApplication(app, job);
};

// Admin: status update (shortlist/reject/select) + interview details
export const updateApplicationStatus = async (applicationId, data) => {
  const app = await PlacementApplication.findByPk(applicationId);
  if (!app) { const e = new Error("Application not found"); e.statusCode = 404; throw e; }
  await app.update({
    status:             data.status            || app.status,
    interview_date:     data.interviewDate     || app.interview_date,
    interview_time:     data.interviewTime     || app.interview_time,
    interview_mode:     data.interviewMode     || app.interview_mode,
    online_link:        data.onlineLink        || app.online_link,
    venue:              data.venue             || app.venue,
    guidelines:         data.guidelines        || app.guidelines,
    documents_required: data.documentsRequired || app.documents_required,
  });
  return formatApplication(app);
};

// ── Documents (resume + portfolio) ────────────────────────────────────────────

export const getDocuments = async (studentId) => {
  const doc = await PlacementDocument.findOne({ where: { student_id: String(studentId) } });
  return {
    resumeUrl:     doc?.resume_url     || null,
    resumeName:    doc?.resume_name    || null,
    portfolioUrl:  doc?.portfolio_url  || null,
    portfolioName: doc?.portfolio_name || null,
  };
};

export const uploadResume = async (studentId, file) => {
  const { url } = await uploadToS3(file, `placement/resumes/${studentId}`);
  const [doc] = await PlacementDocument.upsert({
    student_id:   String(studentId),
    resume_url:   url,
    resume_name:  file.originalname || "resume.pdf",
  });
  return { resumeUrl: doc.resume_url, resumeName: doc.resume_name };
};

export const uploadPortfolio = async (studentId, file) => {
  const { url } = await uploadToS3(file, `placement/portfolio/${studentId}`);
  const [doc] = await PlacementDocument.upsert({
    student_id:    String(studentId),
    portfolio_url:  url,
    portfolio_name: file.originalname || "portfolio.pdf",
  });
  return { portfolioUrl: doc.portfolio_url, portfolioName: doc.portfolio_name };
};

// ── History ───────────────────────────────────────────────────────────────────

export const getHistory = async (studentId) => {
  const rows = await PlacementHistory.findAll({
    where: { student_id: String(studentId) },
    order: [["created_at", "DESC"]],
  });
  return rows.map(formatHistory);
};

export const addHistoryEntry = async (studentId, data) => {
  const entry = await PlacementHistory.create({
    student_id: String(studentId),
    role:       data.role,
    company:    data.company,
    year:       data.year    || null,
    package:    data.package || null,
    type:       data.type    || "Full Time",
    notes:      data.notes   || null,
  });
  return formatHistory(entry);
};

export const deleteHistoryEntry = async (historyId, studentId) => {
  const entry = await PlacementHistory.findOne({
    where: { id: historyId, student_id: String(studentId) },
  });
  if (!entry) { const e = new Error("Entry not found"); e.statusCode = 404; throw e; }
  await entry.destroy();
  return { message: "Entry deleted" };
};

// ── Overview (single round-trip for PlacementController) ─────────────────────

export const getPlacementOverview = async (studentId) => {
  const [jobs, applications, history, documents] = await Promise.all([
    getJobs(),
    getApplications(studentId),
    getHistory(studentId),
    getDocuments(studentId),
  ]);
  return {
    jobs,
    applications,
    history,
    resumeUrl:     documents.resumeUrl,
    portfolioUrl:  documents.portfolioUrl,
    resumeName:    documents.resumeName,
    portfolioName: documents.portfolioName,
  };
};