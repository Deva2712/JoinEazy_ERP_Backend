import { Schedule, MeetingRequest, OutgoingMeetingRequest } from "./schedule-model.js";
import {Op} from "sequelize";
const normalizeEntry = (e, professorId, type = "class") => ({
  professor_id: professorId,
  title:      e.title      || e.courseName  || e.name || "Untitled",
  day:        e.day,
  start_time: e.start_time || e.startTime,
  end_time:   e.end_time   || e.endTime,
  venue:      e.venue      || e.roomNumber  || null,
  cohort_id:  e.cohort_id  || e.courseCode  || null,
  type,
});

const fmtMeeting = (m) => {
  const json = m.toJSON ? m.toJSON() : m;
  return {
    ...json,
    subject:               json.subject || json.title || "Meeting Request",
    participantName:       json.participant_name || "Unknown Student",
    participantRole:       json.participant_role || "Student",
    participantDepartment: json.participant_dept || "",
    startTime:             json.proposed_time || json.rescheduled_time || null,
    requestedTime:         json.proposed_time || null,
    type:                  json.meeting_type || "Online",
    reason:                json.reason || json.message || "",
    rejectionReason:       json.rejection_reason || "",
    meetingLink:           json.meeting_link || "",
    location:              json.location || "",
  };
};

const fmtOutgoing = (r) => {
  const json = r.toJSON ? r.toJSON() : r;
  return {
    ...json,
    subject:               json.subject,
    participantName:       json.recipient_name || "Unknown",
    participantRole:       json.recipient_role || "",
    participantDepartment: json.recipient_department || "",
    startTime:             json.requested_time || null,
    requestedTime:         json.requested_time || null,
    type:                  json.mode || "Online",
    reason:                json.reason || json.note || "",
    rejectionReason:       "",
    meetingLink:           json.link || "",
    location:              json.venue || "",
  };
};

export const getProfessorSchedule = async (professorId) => {
  const entries = await Schedule.findAll({ 
    where: { professor_id: professorId }, 
    order: [["day","ASC"],["start_time","ASC"]] 
  });

  // RECEIVED  (professor_id = my ID, student_id != my ID)
  const receivedMeetings = await MeetingRequest.findAll({ 
    where: { 
      professor_id: professorId,
      student_id: { [Op.ne]: professorId }
    } 
  });

  // SENT —  (student_id = my ID, professor_id != my ID)
  const sentMeetings = await MeetingRequest.findAll({ 
    where: { 
      student_id: professorId,
      professor_id: { [Op.ne]: professorId }  // ← apne aap ko bheja exclude karo
    } 
  });

  const outgoing = await OutgoingMeetingRequest.findAll({ 
    where: { professor_id: professorId } 
  });

  const timetable   = entries.filter(e => e.type !== "office_hours").map(e => ({
    ...e.toJSON(), courseName: e.title, startTime: e.start_time, endTime: e.end_time, roomNumber: e.venue,
  }));
  const officeHours = entries.filter(e => e.type === "office_hours").map(e => e.toJSON());

  return {
    schedule:          { timetable, officeHours },
    scheduledMeetings: receivedMeetings.filter(m => m.status === "accepted").map(fmtMeeting),
    meetingRequests:   receivedMeetings.filter(m => m.status === "pending").map(fmtMeeting),
    outgoingRequests:  [
      ...sentMeetings.map(fmtMeeting),
      ...outgoing.map(fmtOutgoing),
    ],
  };
};
export const upsertSchedule = async (professorId, data) => {
  console.log("=== SCHEDULE PUT PAYLOAD ===", JSON.stringify(data, null, 2));

  const timetable   = data.timetable   || [];
  const officeHours = data.officeHours || [];

  console.log("timetable count:", timetable.length);
  console.log("officeHours count:", officeHours.length);

  if (timetable.length === 0 && officeHours.length === 0) {
    const norm = normalizeEntry(data, professorId);
    console.log("Single entry normalized:", norm);
    if (!norm.day || !norm.start_time || !norm.end_time) {
      console.log("Single entry skipped — missing fields");
      return { entries: [], count: 0 };
    }
    const entry = await Schedule.create(norm);
    return { entry: entry.toJSON(), count: 1 };
  }

  const results = [];

  for (const e of timetable) {
    const norm = normalizeEntry(e, professorId, e.type || "class");
    console.log("Timetable entry normalized:", norm);
    if (!norm.title || !norm.day || !norm.start_time || !norm.end_time) {
      console.log("SKIPPED — missing:", { title: norm.title, day: norm.day, start_time: norm.start_time, end_time: norm.end_time });
      continue;
    }
    const [entry, created] = await Schedule.findOrCreate({
      where: { professor_id: professorId, day: norm.day, start_time: norm.start_time, title: norm.title },
      defaults: norm,
    });
    console.log(created ? "CREATED" : "FOUND EXISTING", entry.id);
    results.push(entry.toJSON());
  }

  for (const e of officeHours) {
    const norm = normalizeEntry(e, professorId, "office_hours");
    if (!norm.day || !norm.start_time || !norm.end_time) continue;
    const [entry] = await Schedule.findOrCreate({
      where: { professor_id: professorId, day: norm.day, start_time: norm.start_time, type: "office_hours" },
      defaults: norm,
    });
    results.push(entry.toJSON());
  }

  return { entries: results, count: results.length };
};

export const createScheduleEntry = upsertSchedule;

export const getMeetingRequests = async (professorId) => {
  const meetings = await MeetingRequest.findAll({ where: { professor_id: professorId } });
  return { meetings: meetings.map(fmtMeeting) };
};

export const createMeetingRequest = async (requesterId, data) => {
  const User = (await import("../auth/auth-model.js")).default;

  const targetId = data.professor_id || data.professorId;
  const requester = await User.findByPk(requesterId, { attributes: ["id", "name", "role"] });

  const meeting = await MeetingRequest.create({
    professor_id:     targetId || requesterId,
    student_id:       requesterId,
    title:            data.title || data.subject || data.reason || "Meeting Request",
    subject:          data.subject || data.title || "Meeting Request",
    participant_name: requester?.name || null,        // ← requester name
    participant_role: requester?.role || "professor", // ← requester role
    participant_dept: data.participantDepartment || null,
    reason:           data.reason || data.message || null,
    meeting_type:     data.type || data.meetingType || "Online",
    meeting_link:     data.meetingLink || null,
    location:         data.location || null,
    proposed_time:    data.proposed_time || data.proposedTime || data.dateTime || new Date(),
    message:          data.message || data.reason || null,
    status:           "pending",
  });
  return { meeting: fmtMeeting(meeting) };
};

export const updateMeetingStatus = async (requestId, status, data = {}) => {
  const meeting = await MeetingRequest.findByPk(requestId);
  if (!meeting) { const err = new Error("Meeting not found"); err.statusCode = 404; throw err; }
  await meeting.update({
    status,
    ...(data.rescheduledTime ? { rescheduled_time: data.rescheduledTime } : {}),
    ...(data.rejectionReason ? { rejection_reason: data.rejectionReason } : {}),
    ...(data.meetingLink ? { meeting_link: data.meetingLink } : {}),
  });
  return { meeting: fmtMeeting(meeting) };
};

export const createOutgoingRequest = async (professorId, data) => {
  const request = await OutgoingMeetingRequest.create({
    professor_id:         professorId,
    recipient_name:       data.recipientName,
    recipient_role:       data.recipientRole || null,
    recipient_department: data.recipientDepartment || null,
    subject:              data.subject,
    requested_time:       data.requestedTime,
    reason:               data.reason || null,
    mode:                 data.mode || null,
    link:                 data.link || null,
    venue:                data.venue || null,
    note:                 data.note || null,
    status:               "pending",
  });
  return fmtOutgoing(request);
};

export const getOutgoingRequests = async (professorId) => {
  const requests = await OutgoingMeetingRequest.findAll({ where: { professor_id: professorId } });
  return { requests: requests.map(fmtOutgoing) };
};