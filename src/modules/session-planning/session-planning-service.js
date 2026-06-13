import { SessionSchedule, SessionReflection, SessionDocument } from "./session-planning-model.js";

export const getSchedules = async (professorId) => {
  const schedules = await SessionSchedule.findAll({ where: { professor_id: professorId } });
  return { schedules };
};
export const getTodaySessions = async (professorId) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
  const sessions = await SessionSchedule.findAll({ where: { professor_id: professorId, scheduled_at: { $gte: today, $lt: tomorrow } } });
  return { sessions };
};
export const getReflections = async (professorId) => {
  const reflections = await SessionReflection.findAll({ where: { professor_id: professorId } });
  return { reflections };
};
export const getDocuments = async (courseId) => {
  const documents = await SessionDocument.findAll({ where: { course_id: courseId } });
  return { documents };
};
export const bulkCreateDocuments = async (courseId, professorId, docs) => {
  const documents = await SessionDocument.bulkCreate(docs.map(d => ({ ...d, course_id: courseId, professor_id: professorId })));
  return { documents };
};