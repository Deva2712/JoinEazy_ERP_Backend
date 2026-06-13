import Leave from "./leave-model.js";

export const getApplications = async (userId) => {
  const applications = await Leave.findAll({ where: { applicant_id: userId } });
  return { applications };
};

export const createApplication = async (userId, userName, data) => {
  const leave = await Leave.create({
    applicant_id: userId,
    applicant_name: userName,
    ...data,
  });
  return { leave };
};

export const updateApplication = async (id, userId, data) => {
  const leave = await Leave.findOne({ where: { id, applicant_id: userId } });
  if (!leave) {
    const err = new Error("Leave application not found");
    err.statusCode = 404;
    throw err;
  }
  await leave.update(data);
  return { leave };
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
    if (action === "approved" && leave.hod_status === "approved") {
      await leave.update({ status: "approved" });
    } else if (action === "rejected") {
      await leave.update({ status: "rejected" });
    }
  }
  return { leave };
};

export const respondToSubstitution = async (id, userId, action) => {
  const leave = await Leave.findOne({ where: { id, substitute_id: userId } });
  if (!leave) {
    const err = new Error("Substitution request not found");
    err.statusCode = 404;
    throw err;
  }
  await leave.update({ substitute_status: action });
  return { leave };
};