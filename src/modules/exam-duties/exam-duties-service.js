import ExamDuty from "./exam-duties-model.js";

export const getDuties = async (userId) => {
  const duties = await ExamDuty.findAll({ where: { professor_id: userId } });
  return { duties };
};

export const updateDutyStatus = async (id, userId, payload) => {
  const duty = await ExamDuty.findOne({ where: { id, professor_id: userId } });
  if (!duty) {
    const err = new Error("Duty not found");
    err.statusCode = 404;
    throw err;
  }
  await duty.update({ status: payload.status });
  return { duty };
};