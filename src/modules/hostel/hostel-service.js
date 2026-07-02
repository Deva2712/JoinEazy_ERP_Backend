// src/modules/hostel/hostel-service.js
import {
  HostelRoomAllotment,
  HostelLeaveRequest,
  HostelOutingRequest,
  HostelMaintenanceRequest,
  HostelComplaint,
} from "./hostel-model.js";
import User from "../auth/auth-model.js";
import { notify } from "../../utils/notification-helper.js";

// Static hostel-admin contact info (no admin UI for this yet — kept centralized here)
const WARDEN_CONTACT      = { contact: "+91 98765 43210", email: "warden.hostel@joineazy.edu" };
const STUDENT_AFFAIRS     = { name: "Student Affairs Office",   officeContact: "+91 98765 11111", email: "studentaffairs@joineazy.edu" };
const MAINTENANCE_DEPT    = { name: "Hostel Maintenance Cell",  contact: "+91 98765 22222",       email: "maintenance@joineazy.edu" };
const ANTI_RAGGING_DEPT   = { name: "Anti-Ragging Committee",   contact: "+91 98765 33333",        email: "antiragging@joineazy.edu" };

const OUTING_STEP_LABELS = ["Submitted", "Parent call", "Warden review", "Decision"];

// ─── Helper: shape formatters ─────────────────────────────────────────────────
const formatRoom = (r) => {
  if (!r) return null;
  const j = r.toJSON ? r.toJSON() : r;
  return {
    block:        j.block,
    roomNumber:   j.room_number,
    type:         j.type,
    floorNumber:  j.floor_number,
    allottedFrom: j.allotted_from,
  };
};

const formatLeave = (l) => {
  const j = l.toJSON ? l.toJSON() : l;
  return {
    id:              j.id,
    fromDate:        j.from_date,
    fromTime:        j.from_time,
    toDate:          j.to_date,
    toTime:          j.to_time,
    reason:          j.reason,
    parentContact:   j.parent_contact,
    status:          j.status,
    rejectionReason: j.rejection_reason,
    submittedAt:     j.created_at,
  };
};

const formatOuting = (o) => {
  const j = o.toJSON ? o.toJSON() : o;
  return {
    id:              j.id,
    date:            j.date,
    outTime:         j.out_time,
    returnTime:      j.return_time,
    purpose:         j.purpose,
    parentContact:   j.parent_contact,
    status:          j.status,
    currentStep:     j.current_step,
    rejectionReason: j.rejection_reason,
    submittedAt:     j.created_at,
  };
};

const formatMaintenance = (m) => {
  const j = m.toJSON ? m.toJSON() : m;
  return {
    id:          j.id,
    category:    j.category,
    description: j.description,
    priority:    j.priority,
    status:      j.status,
    steps:       j.steps || [],
    submittedAt: j.created_at,
  };
};

const formatComplaint = (c) => {
  const j = c.toJSON ? c.toJSON() : c;
  return {
    id:          j.id,
    subject:     j.subject,
    description: j.description,
    against:     j.against,
    status:      j.status,
    submittedAt: j.created_at,
  };
};

// ─── GET dashboard (everything HostelUI needs) ───────────────────────────────
export const getDashboard = async (studentId) => {
  const [user, room, leaves, outings, maintenance, complaints] = await Promise.all([
    User.findByPk(studentId, { attributes: ["id", "name", "email", "mobileNumber", "alternateNumber"] }),
    HostelRoomAllotment.findOne({ where: { student_id: studentId } }),
    HostelLeaveRequest.findAll({ where: { student_id: studentId }, order: [["created_at", "DESC"]] }),
    HostelOutingRequest.findAll({ where: { student_id: studentId }, order: [["created_at", "DESC"]] }),
    HostelMaintenanceRequest.findAll({ where: { student_id: studentId }, order: [["created_at", "DESC"]] }),
    HostelComplaint.findAll({ where: { student_id: studentId }, order: [["created_at", "DESC"]] }),
  ]);

  return {
    roomAllotment:       formatRoom(room),
    leaveRequests:       leaves.map(formatLeave),
    outingRequests:      outings.map(formatOuting),
    maintenanceRequests: maintenance.map(formatMaintenance),
    complaints:          complaints.map(formatComplaint),
    userProfile: {
      parentContact: user?.alternateNumber || user?.mobileNumber || "",
      wardenContact: WARDEN_CONTACT.contact,
      wardenEmail:   WARDEN_CONTACT.email,
    },
    maintenanceDept: MAINTENANCE_DEPT,
    antiRaggingDept: ANTI_RAGGING_DEPT,
    studentAffairs:  STUDENT_AFFAIRS,
  };
};

// ─── CREATE leave request ─────────────────────────────────────────────────────
export const createLeaveRequest = async (studentId, data) => {
  const leave = await HostelLeaveRequest.create({
    student_id:     studentId,
    from_date:      data.fromDate,
    from_time:      data.fromTime,
    to_date:        data.toDate,
    to_time:        data.toTime,
    reason:         data.reason,
    parent_contact: data.parentContact || null,
  });
  return formatLeave(leave);
};

// ─── CREATE outing request ────────────────────────────────────────────────────
export const createOutingRequest = async (studentId, data) => {
  const outing = await HostelOutingRequest.create({
    student_id:     studentId,
    date:           data.date,
    out_time:       data.outTime,
    return_time:    data.returnTime,
    purpose:        data.purpose,
    parent_contact: data.parentContact || null,
    current_step:   0,
  });
  return formatOuting(outing);
};

// ─── CREATE maintenance request ───────────────────────────────────────────────
export const createMaintenanceRequest = async (studentId, data) => {
  const request = await HostelMaintenanceRequest.create({
    student_id:  studentId,
    category:    data.category,
    description: data.description,
    priority:    data.priority || "Medium",
    steps:       [{ label: "Request submitted", completedAt: new Date().toISOString() }],
  });
  return formatMaintenance(request);
};

// ─── CREATE complaint ──────────────────────────────────────────────────────────
export const createComplaint = async (studentId, data) => {
  const complaint = await HostelComplaint.create({
    student_id:  studentId,
    subject:     data.subject,
    description: data.description,
    against:     data.against || null,
  });
  return formatComplaint(complaint);
};

// ─── (Warden) GET full hostel overview — all students, all requests ─────────
export const getWardenDashboard = async () => {
  const [
    rooms,
    leaves,
    outings,
    maintenance,
    complaints,
  ] = await Promise.all([
    HostelRoomAllotment.findAll(),
    HostelLeaveRequest.findAll({ order: [["created_at", "DESC"]] }),
    HostelOutingRequest.findAll({ order: [["created_at", "DESC"]] }),
    HostelMaintenanceRequest.findAll({ order: [["created_at", "DESC"]] }),
    HostelComplaint.findAll({ order: [["created_at", "DESC"]] }),
  ]);

  // Pull student names/emails for display
  const studentIds = [
    ...new Set([
      ...rooms.map((r) => r.student_id),
      ...leaves.map((l) => l.student_id),
      ...outings.map((o) => o.student_id),
      ...maintenance.map((m) => m.student_id),
      ...complaints.map((c) => c.student_id),
    ]),
  ];
  const students = studentIds.length
    ? await User.findAll({ where: { id: studentIds }, attributes: ["id", "name", "email"] })
    : [];
  const studentMap = Object.fromEntries(students.map((s) => [s.id, { name: s.name, email: s.email }]));

  const withStudent = (j) => ({ studentName: studentMap[j.student_id]?.name || null, studentEmail: studentMap[j.student_id]?.email || null });

  return {
    roomAllotments: rooms.map((r) => ({ ...formatRoom(r), studentId: r.student_id, ...withStudent(r) })),
    leaveRequests: leaves.map((l) => ({ ...formatLeave(l), studentId: l.student_id, ...withStudent(l) })),
    outingRequests: outings.map((o) => ({ ...formatOuting(o), studentId: o.student_id, ...withStudent(o) })),
    maintenanceRequests: maintenance.map((m) => ({ ...formatMaintenance(m), studentId: m.student_id, ...withStudent(m) })),
    complaints: complaints.map((c) => ({ ...formatComplaint(c), studentId: c.student_id, ...withStudent(c) })),
    stats: {
      totalStudentsWithRoom: rooms.length,
      pendingLeaves: leaves.filter((l) => l.status === "Pending").length,
      pendingOutings: outings.filter((o) => o.status === "Pending").length,
      openMaintenance: maintenance.filter((m) => m.status === "Pending" || m.status === "In Progress").length,
      openComplaints: complaints.filter((c) => c.status === "Pending" || c.status === "Open" || c.status === "In Progress").length,
    },
  };
};

// ─── (Admin/Warden) Update leave status ──────────────────────────────────────
export const updateLeaveStatus = async (leaveId, status, rejectionReason = null) => {
  const leave = await HostelLeaveRequest.findByPk(leaveId);
  if (!leave) { const e = new Error("Leave request not found"); e.statusCode = 404; throw e; }
  await leave.update({ status, rejection_reason: status === "Rejected" ? rejectionReason : null });
  await notify(leave.student_id, {
    title: `Hostel Leave ${status}`,
    message: `Your hostel leave request has been ${status.toLowerCase()}.`,
    type: "GENERAL",
    link: "/hostel",
  });
  return formatLeave(leave);
};

// ─── (Admin/Warden) Update outing step/status ────────────────────────────────
export const updateOutingProgress = async (outingId, { currentStep, status, rejectionReason } = {}) => {
  const outing = await HostelOutingRequest.findByPk(outingId);
  if (!outing) { const e = new Error("Outing request not found"); e.statusCode = 404; throw e; }

  const updates = {};
  if (currentStep !== undefined) updates.current_step = currentStep;
  if (status) {
    updates.status = status;
    updates.rejection_reason = status === "Rejected" ? rejectionReason : null;
  }
  await outing.update(updates);

  if (status === "Approved" || status === "Rejected") {
    await notify(outing.student_id, {
      title: `Outing Request ${status}`,
      message: `Your outing request has been ${status.toLowerCase()}.`,
      type: "GENERAL",
      link: "/hostel",
    });
  }
  return formatOuting(outing);
};

// ─── (Admin/Maintenance) Update maintenance status/steps ─────────────────────
export const updateMaintenanceStatus = async (requestId, { status, stepLabel, note } = {}) => {
  const request = await HostelMaintenanceRequest.findByPk(requestId);
  if (!request) { const e = new Error("Maintenance request not found"); e.statusCode = 404; throw e; }

  const updates = {};
  if (status) updates.status = status;
  if (stepLabel) {
    const steps = [...(request.steps || []), { label: stepLabel, completedAt: new Date().toISOString(), note: note || null }];
    updates.steps = steps;
  }
  await request.update(updates);

  if (status) {
    await notify(request.student_id, {
      title: "Maintenance Update",
      message: `Your maintenance request status: ${status}.`,
      type: "GENERAL",
      link: "/hostel",
    });
  }
  return formatMaintenance(request);
};

// ─── (Admin) Update complaint status ──────────────────────────────────────────
export const updateComplaintStatus = async (complaintId, status) => {
  const complaint = await HostelComplaint.findByPk(complaintId);
  if (!complaint) { const e = new Error("Complaint not found"); e.statusCode = 404; throw e; }
  await complaint.update({ status });
  await notify(complaint.student_id, {
    title: "Complaint Update",
    message: `Your complaint status: ${status}.`,
    type: "GENERAL",
    link: "/hostel",
  });
  return formatComplaint(complaint);
};

// ─── (Admin) Set/Update room allotment ───────────────────────────────────────
export const setRoomAllotment = async (studentId, data) => {
  const [room] = await HostelRoomAllotment.findOrCreate({
    where: { student_id: studentId },
    defaults: {
      block:         data.block,
      room_number:   data.roomNumber,
      type:          data.type,
      floor_number:  data.floorNumber,
      allotted_from: data.allottedFrom || new Date(),
    },
  });
  await room.update({
    block:        data.block        ?? room.block,
    room_number:  data.roomNumber   ?? room.room_number,
    type:         data.type         ?? room.type,
    floor_number: data.floorNumber  ?? room.floor_number,
    allotted_from: data.allottedFrom ?? room.allotted_from,
  });
  return formatRoom(room);
};