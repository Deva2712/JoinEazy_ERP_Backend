// src/modules/leave/leave-service.js
import Leave from "./leave-model.js";
import User from "../auth/auth-model.js";
import sequelize from "../../database/connection.js";
import { Op } from "sequelize";

const mapToDbFields = (data) => ({
  leave_type:    data.leaveType          ?? data.leave_type,
  from_date:     data.fromDate           ?? data.from_date,
  to_date:       data.toDate             ?? data.to_date,
  reason:        data.reason,
  substitute_id:   data.replacementFacultyId || data.replacementFaculty || data.substitute_id || null,
  substitute_name: data.replacementFacultyName || data.substitute_name || null,
  course_name:   data.courseName   || data.course_name   || null,
  room_number:   data.roomNumber   || data.room_number   || null,
  start_time:    data.timings?.startTime || data.startTime || data.start_time || null,
  end_time:      data.timings?.endTime   || data.endTime   || data.end_time   || null,
  note:          data.note || null,
  status:        data.status             ?? "Pending",
  supporting_doc_url: data.supporting_doc_url || null,
});

const formatLeave = (leave) => {
  const j = leave.toJSON ? leave.toJSON() : leave;
  return {
    id:                 j.id,
    applicantId:        j.applicant_id,
    applicantName:      j.applicant_name,
    requesterName:      j.applicant_name,
    fromDate:           j.from_date,
    toDate:             j.to_date,
    reason:             j.reason,
    replacementFaculty:     j.substitute_name || j.substitute_id,
    replacementFacultyId:   j.substitute_id,
    replacementFacultyName: j.substitute_name,
    courseName:    j.course_name,
    roomNumber:    j.room_number,
    timings: {
      startTime: j.start_time,
      endTime:   j.end_time,
    },
    note:          j.note,
    supportingDocUrl: j.supporting_doc_url || null,
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
  const user = await User.findByPk(userId, { attributes: ["id", "name"] });

  const [applications, substitutionRequests, faculties] = await Promise.all([
    Leave.findAll({
      where: { applicant_id: userId },
      order: [["created_at", "DESC"]],
    }),
    Leave.findAll({
      where: {
        [Op.or]: [
          { substitute_id: String(userId) },
          ...(user?.name ? [{ substitute_id: user.name }] : []),
        ],
      },
      order: [["created_at", "DESC"]],
    }),
    getFaculties(userId),
  ]);

  return {
    applications:         applications.map(formatLeave),
    substitutionRequests: substitutionRequests.map(formatLeave),
    faculties,
  };
};

export const createApplication = async (userId, userName, data, fileUrl = null) => {
  const leave = await Leave.create({
    applicant_id:   userId,
    applicant_name: userName,
    ...mapToDbFields(data),
    // file upload se aya URL override karta hai body ka field
    ...(fileUrl && { supporting_doc_url: fileUrl }),
  });
  return { application: formatLeave(leave) };
};

export const updateApplication = async (id, userId, data, fileUrl = null) => {
  const leave = await Leave.findOne({ where: { id, applicant_id: userId } });
  if (!leave) {
    const err = new Error("Leave application not found");
    err.statusCode = 404;
    throw err;
  }
  await leave.update({
    ...mapToDbFields(data),
    ...(fileUrl && { supporting_doc_url: fileUrl }),
  });
  return { application: formatLeave(leave) };
};

const checkAndFinalize = async (leave) => {
  const hodOk  = leave.hod_status  === "Approved";
  const hrOk   = leave.hr_status   === "Approved";
  const hasSubstitute = !!leave.substitute_id;
  const subOk  = !hasSubstitute || leave.substitute_status === "Accepted";

  if (hodOk && hrOk && subOk) {
    await leave.update({ status: "Approved" });
  } else if (
    leave.hod_status  === "Rejected" ||
    leave.hr_status   === "Rejected" ||
    leave.substitute_status === "Rejected"
  ) {
    await leave.update({ status: "Rejected" });
  }
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
  }

  await leave.reload();
  await checkAndFinalize(leave);
  await leave.reload();
  return { application: formatLeave(leave) };
};

export const respondToSubstitution = async (id, userId, action) => {
  let leave = await Leave.findOne({ where: { id, substitute_id: String(userId) } });

  if (!leave) {
    const candidate = await Leave.findByPk(id);
    if (candidate) {
      const subUser = await User.findByPk(userId, { attributes: ["id", "name"] });
      if (
        subUser &&
        (candidate.substitute_id === subUser.name ||
         candidate.substitute_name === subUser.name ||
         String(candidate.substitute_id) === String(userId))
      ) {
        leave = candidate;
      }
    }
  }

  if (!leave) {
    const err = new Error("Substitution request not found");
    err.statusCode = 404;
    throw err;
  }
  await leave.update({ substitute_status: action });
  await leave.reload();
  await checkAndFinalize(leave);
  await leave.reload();
  return { application: formatLeave(leave) };
};