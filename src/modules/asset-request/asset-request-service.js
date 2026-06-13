// src/modules/asset-request/asset-request-service.js
import { Asset, AssetRequest } from "./asset-request-model.js";

// ─── Helper: shape request for frontend ──────────────────────────────────────
const transformRequest = (r) => {
  const j = r.toJSON ? r.toJSON() : r;
  const out = {
    id:               j.id,
    type:             j.type,
    assetId:          j.asset_id,
    assetName:        j.asset_name,
    course:           j.course,
    cohortId:         j.cohort_id,
    date:             j.date,
    startTime:        j.start_time,
    endTime:          j.end_time,
    reason:           j.reason,
    status:           j.status,
    rejectionReason:  j.rejection_reason,
    postedAt:         j.posted_at,
    requesterId:      j.requester_id,
    requesterName:    j.requester_name,
  };

  // Split duration_days back into years/months/days for Accommodation
  if (j.type === "Accommodation" && j.duration_days != null) {
    out.duration_years  = Math.floor(j.duration_days / 365);
    out.duration_months = Math.floor((j.duration_days % 365) / 30);
    out.duration_days_remainder = (j.duration_days % 365) % 30;
    out.duration = j.duration_days; // total days
  }

  return out;
};

// ─── Helper: shape asset for frontend ────────────────────────────────────────
const transformAsset = (a) => {
  const j = a.toJSON ? a.toJSON() : a;
  return {
    id:          j.id,
    name:        j.name,
    type:        j.type,
    location:    j.location,
    capacity:    j.capacity,
    status:      j.status,
    description: j.description,
  };
};

// GET /assets/list — returns array directly
export const getAssets = async () => {
  const assets = await Asset.findAll({ order: [["type", "ASC"], ["name", "ASC"]] });
  return assets.map(transformAsset);
};

// GET /assets/requests — returns { requests, admins }
export const getRequests = async (user) => {
  const where = {};
  // Students see only their own requests; admins see all
  if (user.role !== "admin" && user.role !== "staff") {
    where.requester_id = user.id;
  }

  const requests = await AssetRequest.findAll({
    where,
    order: [["posted_at", "DESC"]],
  });

  return {
    requests: requests.map(transformRequest),
    admins:   [], // placeholder — populate if you have an admins directory
  };
};

// POST /assets/requests
export const createRequest = async (data, user) => {
 const asset = data.assetId && /^[0-9a-f-]{36}$/i.test(data.assetId)
  ? await Asset.findByPk(data.assetId)
  : null;

  // Combine accommodation duration fields into total days
  let durationDays = null;
  if (data.type === "Accommodation") {
    const y = parseInt(data.duration_years) || 0;
    const m = parseInt(data.duration_months) || 0;
    const d = parseInt(data.duration_days) || 0;
    durationDays = y * 365 + m * 30 + d;
  }

  const request = await AssetRequest.create({
    requester_id:   user.id,
    requester_name: user.name,
    asset_id:       asset ? asset.id : null,
    asset_name:     asset?.name || data.assetName || null,
    type:           data.type,
    date:           data.date || null,
    start_time:     data.startTime || null,
    end_time:       data.endTime || null,
    course:         data.course || null,
    cohort_id:      data.cohortId || null,
    duration_days:  durationDays,
    reason:         data.reason || null,
    status:         "Pending",
    posted_at:      new Date(),
  });

  return transformRequest(request);
};

// PUT /assets/requests/:id
export const updateRequest = async (requestId, data, user) => {
  const request = await AssetRequest.findByPk(requestId);
  if (!request) { const e = new Error("Request not found"); e.statusCode = 404; throw e; }

  const isAdmin = user.role === "admin" || user.role === "staff";
  const isOwner = request.requester_id === user.id;
  if (!isAdmin && !isOwner) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }

  // Admin actions — approve / reject
  if (isAdmin && data.status) {
    await request.update({
      status:           data.status,
      rejection_reason: data.rejectionReason || data.rejection_reason || null,
      reviewed_by:      user.id,
      reviewed_at:      new Date(),
    });
    return transformRequest(request);
  }

  // Owner resubmission / edit
  let durationDays = request.duration_days;
  if (data.type === "Accommodation") {
    const y = parseInt(data.duration_years) || 0;
    const m = parseInt(data.duration_months) || 0;
    const d = parseInt(data.duration_days) || 0;
    durationDays = y * 365 + m * 30 + d;
  }

  await request.update({
    type:           data.type           ?? request.type,
    asset_id:       data.assetId        ?? request.asset_id,
    date:           data.date           ?? request.date,
    start_time:     data.startTime      ?? request.start_time,
    end_time:       data.endTime        ?? request.end_time,
    course:         data.course         ?? request.course,
    cohort_id:       data.cohortId       ?? request.cohort_id,
    duration_days:  durationDays,
    reason:         data.reason         ?? request.reason,
    status:         "Resubmitted",
  });

  return transformRequest(request);
};