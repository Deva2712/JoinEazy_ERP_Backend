// src/modules/cohort-meetings/cohort-meetings-service.js
import CohortMeeting from "./cohort-meetings-model.js";
import { MeetingRequest } from "../schedule/schedule-model.js";
import { Cohort } from "../cohort/cohort-model.js";
import { addJobToMany } from "../../utils/job-tray-helper.js";
import CohortMember from "../cohort-members/cohort-members-model.js";

export const getMeetings = async (cohortId) => {
  const meetings = await CohortMeeting.findAll({
    where: { cohort_id: cohortId },
    order: [["scheduled_at", "DESC"]],
  });
  return meetings.map((m) => m.toJSON());
};

export const createMeeting = async (cohortId, data, author) => {
  const meeting = await CohortMeeting.create({
    cohort_id:       cohortId,
    created_by:      author.id,
    created_by_name: author.name,
    title:           data.title,
    description:     data.description || null,
    meeting_url:     data.meetingUrl || data.meeting_url || null,
    platform:        data.platform || "zoom",
    scheduled_at:    data.scheduledAt || data.scheduled_at,
    duration_mins:   data.durationMins || data.duration_mins || 60,
  });

  // FIX (functional gap): scheduled meetings never showed up as an actionable pending
  // task for the cohort — students only found out by opening the meetings tab.
  const students = await CohortMember.findAll({ where: { cohort_id: String(cohortId), role: "student" } });
  await addJobToMany(students.map((s) => s.user_id), {
    type: "meeting",
    title: `Meeting scheduled: ${meeting.title}`,
    message: meeting.scheduled_at ? `Scheduled for ${new Date(meeting.scheduled_at).toLocaleString()}.` : null,
    link: "/cohort/meetings",
    priority: "high",
  });

  return meeting.toJSON();
};

export const updateMeeting = async (cohortId, meetingId, data, authorId) => {
  const meeting = await CohortMeeting.findOne({ where: { id: meetingId, cohort_id: cohortId } });
  if (!meeting) { const e = new Error("Meeting not found"); e.statusCode = 404; throw e; }
  if (meeting.created_by !== authorId) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }
  await meeting.update({
    title:         data.title         ?? meeting.title,
    description:   data.description   ?? meeting.description,
    meeting_url:   data.meetingUrl    ?? meeting.meeting_url,
    scheduled_at:  data.scheduledAt   ?? meeting.scheduled_at,
    duration_mins: data.durationMins  ?? meeting.duration_mins,
    status:        data.status        ?? meeting.status,
  });
  return meeting.toJSON();
};

export const deleteMeeting = async (cohortId, meetingId, authorId, userRole) => {
  const meeting = await CohortMeeting.findOne({ where: { id: meetingId, cohort_id: cohortId } });
  if (!meeting) { const e = new Error("Meeting not found"); e.statusCode = 404; throw e; }
  if (meeting.created_by !== authorId && userRole !== "admin") { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }
  await meeting.destroy();
  return { deleted: true };
};
const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const fmtStudentMeeting = (m) => {
  const json = m.toJSON();
  return {
    id: json.id,
    professorName: json.professor_name || "Professor",
    reason: json.description || "",
    dateTime: json.scheduled_at,
    requestedTime: json.scheduled_at,
    submittedAt: json.createdAt,
    status: json.status,
  };
};

export const getStudentMeetings = async (cohortId, studentId) => {
  if (!isValidUUID(cohortId) || !isValidUUID(studentId)) return [];
  const meetings = await CohortMeeting.findAll({
    where: { cohort_id: cohortId, student_id: studentId, status: "accepted" },
    order: [["scheduled_at", "ASC"]],
  });
  return meetings.map(fmtStudentMeeting);
};

export const getStudentMeetingRequests = async (cohortId, studentId) => {
  if (!isValidUUID(cohortId) || !isValidUUID(studentId)) return [];
  const meetings = await CohortMeeting.findAll({
    where: { cohort_id: cohortId, student_id: studentId, status: "pending" },
    order: [["created_at", "DESC"]],
  });
  return meetings.map(fmtStudentMeeting);
};

export const createMeetingRequest = async (cohortId, student, data) => {
  const meeting = await CohortMeeting.create({
    cohort_id: cohortId,
    created_by: student.id,
    created_by_name: student.name,
    student_id: student.id,
    professor_id: data.professor_id || data.professorId || null,
    professor_name: data.professorName || null,
    title: data.title || `Meeting request to ${data.professorName || "Professor"}`,
    description: data.reason || data.description || null,
    scheduled_at: data.dateTime || data.scheduled_at || data.proposed_date,
    status: "pending",
  });
  return fmtStudentMeeting(meeting);
};

export const cancelMeetingRequest = async (cohortId, requestId, studentId) => {
  const m = await CohortMeeting.findOne({ where: { id: requestId, cohort_id: cohortId, student_id: studentId } });
  if (!m) { const e = new Error("Not found"); e.statusCode = 404; throw e; }
  await m.destroy(); return { deleted: true };
};