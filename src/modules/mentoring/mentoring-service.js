import { MentorSession, MentorFeedback } from "./mentoring-model.js";

export const getDashboard = async (userId) => {
  const sessions = await MentorSession.findAll({ where: { mentor_id: userId } });
  return { sessions };
};

export const requestMeeting = async (mentorId, menteeId, data) => {
  const session = await MentorSession.create({ mentor_id: mentorId, mentee_id: menteeId, ...data });
  return { session };
};

export const submitFeedback = async (mentorId, menteeId, data) => {
  const feedback = await MentorFeedback.create({ mentor_id: mentorId, mentee_id: menteeId, ...data });
  return { feedback };
};