// src/modules/placement/placement-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./placement-service.js";

const ok  = (res, data, status = 200) => res.status(status).json({ success: true,  data });
const err = (res, msg, status = 400) => res.status(status).json({ success: false, message: msg });

// ── Overview ──────────────────────────────────────────────────────────────────

export const getPlacementOverview = asyncHandler(async (req, res) => {
  ok(res, await svc.getPlacementOverview(req.user.id));
});

// ── Jobs ──────────────────────────────────────────────────────────────────────

export const getJobs = asyncHandler(async (req, res) => {
  ok(res, await svc.getJobs());
});

export const getJobById = asyncHandler(async (req, res) => {
  ok(res, await svc.getJobById(req.params.jobId));
});

export const createJob = asyncHandler(async (req, res) => {
  ok(res, await svc.createJob({ ...req.body, createdBy: req.user.id }), 201);
});

export const updateJob = asyncHandler(async (req, res) => {
  ok(res, await svc.updateJob(req.params.jobId, req.body));
});

export const deleteJob = asyncHandler(async (req, res) => {
  ok(res, await svc.deleteJob(req.params.jobId));
});

// ── Applications ──────────────────────────────────────────────────────────────

export const getApplications = asyncHandler(async (req, res) => {
  ok(res, await svc.getApplications(req.user.id));
});

export const getApplicationById = asyncHandler(async (req, res) => {
  ok(res, await svc.getApplicationById(req.params.applicationId, req.user.id));
});

export const applyToJob = asyncHandler(async (req, res) => {
  const { jobId, ...formData } = req.body;
  if (!jobId) return err(res, "jobId is required");
  ok(res, await svc.applyToJob(req.user.id, jobId, formData), 201);
});

// Frontend ke /placement/apply route ke liye (submitApplication)
export const submitApplication = asyncHandler(async (req, res) => {
  const { jobId, ...formData } = req.body;
  if (!jobId) return err(res, "jobId is required");
  ok(res, await svc.applyToJob(req.user.id, jobId, formData), 201);
});

// Admin: status + interview details update
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  ok(res, await svc.updateApplicationStatus(req.params.applicationId, req.body));
});

// ── Documents ─────────────────────────────────────────────────────────────────

export const getDocuments = asyncHandler(async (req, res) => {
  ok(res, await svc.getDocuments(req.user.id));
});

export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) return err(res, "No file uploaded");
  ok(res, await svc.uploadResume(req.user.id, req.file), 201);
});

export const uploadPortfolio = asyncHandler(async (req, res) => {
  if (!req.file) return err(res, "No file uploaded");
  ok(res, await svc.uploadPortfolio(req.user.id, req.file), 201);
});

// ── History ───────────────────────────────────────────────────────────────────

export const getHistory = asyncHandler(async (req, res) => {
  ok(res, await svc.getHistory(req.user.id));
});

export const addHistoryEntry = asyncHandler(async (req, res) => {
  if (!req.body.role || !req.body.company) return err(res, "role and company are required");
  ok(res, await svc.addHistoryEntry(req.user.id, req.body), 201);
});

export const deleteHistoryEntry = asyncHandler(async (req, res) => {
  ok(res, await svc.deleteHistoryEntry(req.params.historyId, req.user.id));
});