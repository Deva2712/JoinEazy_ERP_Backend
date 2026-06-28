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
      professor_id: { [Op.ne]: professorId }
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

  const targetId = data.professor_id || data.professorId || data.recipientId;

  if (!targetId) {
    const err = new Error("recipientId/professorId is required to create a meeting request");
    err.statusCode = 400;
    throw err;
  }
  if (String(targetId) === String(requesterId)) {
    const err = new Error("You cannot request a meeting with yourself");
    err.statusCode = 400;
    throw err;
  }

  const recipient = await User.findByPk(targetId, { attributes: ["id", "name", "role", "department"] });
  if (!recipient) {
    const err = new Error("Selected recipient was not found");
    err.statusCode = 404;
    throw err;
  }

  const meeting = await MeetingRequest.create({
    professor_id:     targetId,
    student_id:       requesterId,
    title:            data.title || data.subject || data.reason || "Meeting Request",
    subject:          data.subject || data.title || "Meeting Request",
    participant_name: recipient.name || null,                           
    participant_role: recipient.role || "professor",                   
    participant_dept: recipient.department || data.participantDepartment || null,
    reason:           data.reason || data.message || null,
    meeting_type:     data.mode || data.type || data.meetingType || "Online",
    meeting_link:     data.meetingLink || data.link || null,
    location:         data.location || data.venue || null,
    proposed_time:    data.proposed_time || data.proposedTime || data.dateTime || data.requestedTime || new Date(),
    message:          data.message || data.reason || null,
    status:           "pending",
  });
  return { meeting: fmtMeeting(meeting) };
};

export const updateMeetingStatus = async (requestId, status, data = {}, requestingProfessorId = null) => {
  const meeting = await MeetingRequest.findByPk(requestId);
  if (!meeting) { const err = new Error("Meeting not found"); err.statusCode = 404; throw err; }

  // Security: koi bhi professor sirf apne hi paas aayi hui meeting request
  // accept/reject/reschedule kar sake — kisi dusre professor ki nahi, sirf
  // requestId (UUID) jaan ke.
  if (requestingProfessorId && String(meeting.professor_id) !== String(requestingProfessorId)) {
    const err = new Error("You are not authorized to update this meeting request");
    err.statusCode = 403;
    throw err;
  }

  await meeting.update({
    status,
    // mode select karte waqt professor "offline"/"online" bhejta hai — yeh
    // meeting_type column mein save hona chahiye, pehle yeh field check hi
    // nahi hota tha isliye meeting_type hamesha default "Online" reh jaata tha.
    ...(data.mode ? { meeting_type: data.mode.charAt(0).toUpperCase() + data.mode.slice(1) } : {}),
    ...(data.venue ? { location: data.venue } : {}),
    ...(data.link ? { meeting_link: data.link } : {}),
    // Reschedule flow "newDateTime" bhejta hai (camelCase "rescheduledTime" nahi)
    ...(data.newDateTime ? { rescheduled_time: data.newDateTime } : (data.rescheduledTime ? { rescheduled_time: data.rescheduledTime } : {})),
    ...(data.reason ? { rejection_reason: data.reason } : (data.rejectionReason ? { rejection_reason: data.rejectionReason } : {})),
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
    mode:                 data.mode ? data.mode.charAt(0).toUpperCase() + data.mode.slice(1) : null,
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