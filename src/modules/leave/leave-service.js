// src/modules/leave/leave-service.js
import Leave from "./leave-model.js";
import User from "../auth/auth-model.js";   
const mapToDbFields = (data) => ({
  leave_type:    data.leaveType          ?? data.leave_type,
  from_date:     data.fromDate           ?? data.from_date,
  to_date:       data.toDate             ?? data.to_date,
  reason:        data.reason,
  substitute_id: data.replacementFaculty || data.substitute_id || null,
  status:        data.status             ?? "Pending",
});

const formatLeave = (leave) => {
  const j = leave.toJSON ? leave.toJSON() : leave;
  return {
    id:                 j.id,
    applicantId:        j.applicant_id,
    applicantName:      j.applicant_name,
    leaveType:          j.leave_type,
    fromDate:           j.from_date,
    toDate:             j.to_date,
    reason:             j.reason,
    replacementFaculty: j.substitute_id,
    status:             j.status,
    isArchived:         j.is_archived,
    appliedAt:          j.created_at,
    updatedAt:          j.updated_at,
    leaveApproval: {
      HoD: { status: j.hod_status, remark: j.hod_remark },
      HR:  { status: j.hr_status,  remark: j.hr_remark },
    },
    substitutionStatus: j.substitute_status,
  };
};

// ── NEW: fetch all professors for the "Select Faculty" dropdown ──────────────
// excludes the requesting user themself
const getFaculties = async (excludeUserId) => {
  const professors = await User.findAll({
    where: { role: "professor" },
    attributes: ["id", "name", "email"],
    order: [["name", "ASC"]],
  });
  return professors
    .filter((p) => p.id !== excludeUserId)
    .map((p) => ({ id: p.id, name: p.name, email: p.email }));
};

export const getApplications = async (userId) => {
  const [applications, faculties] = await Promise.all([
    Leave.findAll({
      where: { applicant_id: userId },
      order: [["created_at", "DESC"]],
    }),
    getFaculties(userId),
  ]);

  return {
    applications: applications.map(formatLeave),
    faculties,   // ← now populated from DB instead of always []
  };
};

export const createApplication = async (userId, userName, data) => {
  const leave = await Leave.create({
    applicant_id:   userId,
    applicant_name: userName,
    ...mapToDbFields(data),
  });
  return { application: formatLeave(leave) };
};

export const updateApplication = async (id, userId, data) => {
  const leave = await Leave.findOne({ where: { id, applicant_id: userId } });
  if (!leave) {
    const err = new Error("Leave application not found");
    err.statusCode = 404;
    throw err;
  }
  await leave.update(mapToDbFields(data));
  return { application: formatLeave(leave) };
};

export const updateApproval = async (id, role, action, remark) => {
  const leave = await Leave.findByPk(id);
  if (!leave) {
    const err = new Error("Leave application not found");
    err.statusCode = 404;
    throw err;
  }
  if (role === "hod") {
    await leave.update({ hod_status: action, hod_remark: remark });
  } else if (role === "hr") {
    await leave.update({ hr_status: action, hr_remark: remark });
    if (action === "Approved" && leave.hod_status === "Approved") {
      await leave.update({ status: "Approved" });
    } else if (action === "Rejected") {
      await leave.update({ status: "Rejected" });
    }
  }
  return { application: formatLeave(leave) };
};

export const respondToSubstitution = async (id, userId, action) => {
  const leave = await Leave.findOne({ where: { id, substitute_id: userId } });
  if (!leave) {
    const err = new Error("Substitution request not found");
    err.statusCode = 404;
    throw err;
  }
  await leave.update({ substitute_status: action });
  return { application: formatLeave(leave) };
};