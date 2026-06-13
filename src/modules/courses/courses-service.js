import { CourseRegistration, CourseFeedback } from "./courses-model.js";

export const getOverview = async (studentId) => {
  const registrations = await CourseRegistration.findAll({ where: { student_id: studentId } });
  return { registrations };
};
export const register = async (studentId, cohortId) => {
  const reg = await CourseRegistration.create({ student_id: studentId, cohort_id: cohortId });
  return { registration: reg };
};
export const swapCourse = async (regId, studentId, swapRequest) => {
  const reg = await CourseRegistration.findOne({ where: { id: regId, student_id: studentId } });
  if (!reg) { const err = new Error("Registration not found"); err.statusCode = 404; throw err; }
  await reg.update({ swap_request: swapRequest, status: "swapped" });
  return { registration: reg };
};
export const submitFeedback = async (studentId, cohortId, data) => {
  const feedback = await CourseFeedback.create({ student_id: studentId, cohort_id: cohortId, ...data });
  return { feedback };
};