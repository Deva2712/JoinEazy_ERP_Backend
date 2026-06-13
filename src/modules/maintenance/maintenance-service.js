// src/modules/maintenance/maintenance-service.js
import MaintenanceRequest from "./maintenance-model.js";

// ─── Issue Types config ───────────────────────────────────────────────────────
const ISSUE_TYPES = [
  {
    key: "electrical",
    label: "Electrical",
    components: ["Fan", "Light / Tube Light", "AC", "Switch Board", "Power Socket", "Wiring", "Other"],
  },
  {
    key: "plumbing",
    label: "Plumbing",
    components: ["Tap / Faucet", "Pipe Leakage", "Drain Blockage", "Water Heater", "Flush Tank", "Other"],
  },
  {
    key: "carpentry",
    label: "Carpentry",
    components: ["Door", "Window", "Cupboard / Wardrobe", "Furniture", "Lock / Handle", "Other"],
  },
  {
    key: "civil",
    label: "Civil / Structural",
    components: ["Wall Crack", "Ceiling", "Flooring", "Paint / Whitewash", "Waterproofing", "Other"],
  },
  {
    key: "cleaning",
    label: "Cleaning / Housekeeping",
    components: ["Room Cleaning", "Bathroom / Toilet", "Common Area", "Garbage Disposal", "Other"],
  },
  {
    key: "internet",
    label: "Internet / Network",
    components: ["WiFi Not Working", "LAN Port", "Router / Switch", "Slow Speed", "Other"],
  },
  {
    key: "appliance",
    label: "Appliance",
    components: ["Refrigerator", "Washing Machine", "Geyser", "Water Purifier", "Projector", "Other"],
  },
  {
    key: "other",
    label: "Other",
    components: ["General Issue", "Other"],
  },
];

// GET /maintenance/my-requests
export const getMyRequests = async (userId) => {
  const requests = await MaintenanceRequest.findAll({
    where: { requester_id: userId },
    order: [["created_at", "DESC"]],
  });

  return {
    requests:   requests.map((r) => r.toJSON()),
    issueTypes: ISSUE_TYPES,   // ← frontend modal uses this
    technicians: [],
    admins:      [],
  };
};

// POST /maintenance/requests
export const createRequest = async (data, requester) => {
  const request = await MaintenanceRequest.create({
    requester_id:   requester.id,
    requester_name: requester.name,
    category:    data.category,
    location:    data.location,
    title:       data.title || data.issueType || data.category,
    description: data.description || null,
    priority:    data.priority || "medium",
    image_url:   data.imageUrl || data.image_url || null,
  });
  return request.toJSON();
};

// PATCH /maintenance/requests/:id/status
export const updateStatus = async (requestId, data, userId, userRole) => {
  const request = await MaintenanceRequest.findByPk(requestId);
  if (!request) { const e = new Error("Request not found"); e.statusCode = 404; throw e; }

  const isAdmin = userRole === "admin" || userRole === "staff";
  const isOwner = request.requester_id === userId;
  if (!isAdmin && !isOwner) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }

  await request.update({
    status:      data.status      ?? request.status,
    status_note: data.statusNote  ?? request.status_note,
    resolved_at: data.status === "resolved" ? new Date() : request.resolved_at,
  });
  return request.toJSON();
};