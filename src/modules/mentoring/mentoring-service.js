// src/modules/mentoring/mentoring-service.js
import { MentorSession, MentorFeedback } from "./mentoring-model.js";
import User from "../auth/auth-model.js";

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtMentor = (u) => !u ? null : ({
  id:             u.id,
  name:           u.name,
  email:          u.email,
  designation:    u.designation    || "Professor",
  department:     u.department     || "",
  phone:          u.mobileNumber   || u.phone || "",
  officeLocation: u.officeLocation || "",
  officeHours:    u.officeHours    || "",
});

// For ConfirmedMeetingsTab — needs: id, status, mode, date, location, meetLink, notes, rescheduleDate
const fmtConfirmed = (s) => {
  const j = s.toJSON ? s.toJSON() : s;
  const capitalize = (v) => v ? v.charAt(0).toUpperCase() + v.slice(1) : v;
  return {
    id:             j.id,
    status:         capitalize(j.status),   // "Accepted", "Completed", etc.
    mode:           j.mode || "Offline",
    date:           j.reschedule_date || j.scheduled_at,
    location:       j.location || null,
    meetLink:       j.meet_link || null,
    notes:          j.notes || null,
    rescheduleDate: j.reschedule_date || null,
  };
};

// For RequestedMeetingsTab — needs: id, status, mode, agenda, preferredDate, preferredTime, rejectionReason
const fmtRequest = (s) => {
  const j = s.toJSON ? s.toJSON() : s;
  const capitalize = (v) => v ? v.charAt(0).toUpperCase() + v.slice(1) : v;
  const dt = j.scheduled_at ? new Date(j.scheduled_at) : null;
  return {
    id:              j.id,
    status:          capitalize(j.status),
    mode:            j.mode || "Offline",
    agenda:          j.notes || j.title || "",
    preferredDate:   dt ? dt.toISOString().split("T")[0] : null,
    preferredTime:   dt ? dt.toTimeString().slice(0, 5) : null,
    rejectionReason: j.rejection_reason || null,
  };
};

// For FeedbackTab history — needs: id, rating, comment, date
const fmtFeedback = (f) => {
  const j = f.toJSON ? f.toJSON() : f;
  return {
    id:      j.id,
    rating:  j.rating,
    comment: j.feedback || "",
    date:    j.createdAt
      ? new Date(j.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : "",
  };
};

// ─── Service Functions ────────────────────────────────────────────────────────

const CONFIRMED_STATUSES = ["accepted", "completed", "rescheduled"];
const PENDING_STATUSES   = ["pending", "rejected"];

// GET /mentor/dashboard
export const getDashboard = async (studentId) => {
  // Find assigned mentor via earliest session
  const firstSession = await MentorSession.findOne({
    where: { mentee_id: studentId },
    order: [["createdAt", "ASC"]],
  });

  let mentor = null;
  if (firstSession) {
    const mentorUser = await User.findByPk(firstSession.mentor_id, {
      attributes: ["id", "name", "email", "department", "designation", "mobileNumber", "officeLocation"],
    });
    mentor = fmtMentor(mentorUser);
  }

  const allSessions = await MentorSession.findAll({
    where: { mentee_id: studentId },
    order: [["createdAt", "DESC"]],
  });

  const meetings        = allSessions.filter(s => CONFIRMED_STATUSES.includes(s.status)).map(fmtConfirmed);
  const meetingRequests = allSessions.filter(s => PENDING_STATUSES.includes(s.status)).map(fmtRequest);

  const feedbackRows = await MentorFeedback.findAll({
    where:  { mentee_id: studentId },
    order:  [["createdAt", "DESC"]],
  });
  const feedbackHistory = feedbackRows.map(fmtFeedback);

  return { mentor, meetings, meetingRequests, feedbackHistory };
};

// POST /mentor/meetings/request
// body: { preferredDate, preferredTime, mode, agenda }
export const requestMeeting = async (studentId, data) => {
  const firstSession = await MentorSession.findOne({
    where: { mentee_id: studentId },
    order: [["createdAt", "ASC"]],
  });

  const mentorId = data.mentorId || firstSession?.mentor_id;
  if (!mentorId) throw Object.assign(new Error("No mentor assigned yet"), { statusCode: 400 });

  const scheduledAt = data.preferredDate && data.preferredTime
    ? new Date(`${data.preferredDate}T${data.preferredTime}`)
    : new Date();

  const session = await MentorSession.create({
    mentor_id:    mentorId,
    mentee_id:    studentId,
    title:        data.agenda || "Meeting Request",
    scheduled_at: scheduledAt,
    mode:         data.mode   || "Offline",
    notes:        data.agenda || null,
    status:       "pending",
  });

  return fmtRequest(session);
};

// POST /mentor/feedback
// body: { rating, comment }
export const submitFeedback = async (studentId, data) => {
  const firstSession = await MentorSession.findOne({
    where: { mentee_id: studentId },
    order: [["createdAt", "ASC"]],
  });

  const mentorId = data.mentorId || firstSession?.mentor_id;
  if (!mentorId) throw Object.assign(new Error("No mentor assigned yet"), { statusCode: 400 });

  if (!data.rating) throw Object.assign(new Error("Rating is required"), { statusCode: 400 });

  const fb = await MentorFeedback.create({
    session_id: firstSession?.id || null,
    mentor_id:  mentorId,
    mentee_id:  studentId,
    rating:     data.rating,
    feedback:   data.comment || null,
  });

  return fmtFeedback(fb);
};