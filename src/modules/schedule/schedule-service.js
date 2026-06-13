import { Schedule, MeetingRequest } from "./schedule-model.js";

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

export const getProfessorSchedule = async (professorId) => {
  const entries  = await Schedule.findAll({ where: { professor_id: professorId }, order: [["day","ASC"],["start_time","ASC"]] });
  const meetings = await MeetingRequest.findAll({ where: { professor_id: professorId } });

  const timetable   = entries.filter(e => e.type !== "office_hours").map(e => ({
    ...e.toJSON(), courseName: e.title, startTime: e.start_time, endTime: e.end_time, roomNumber: e.venue,
  }));
  const officeHours = entries.filter(e => e.type === "office_hours").map(e => e.toJSON());

  return {
    schedule:          { timetable, officeHours },
    scheduledMeetings: meetings.filter(m => m.status === "accepted").map(m => m.toJSON()),
    meetingRequests:   meetings.filter(m => m.status === "pending").map(m => m.toJSON()),
    outgoingRequests:  [],
  };
};

export const upsertSchedule = async (professorId, data) => {
  // DEBUG — see exact payload
  console.log("=== SCHEDULE PUT PAYLOAD ===", JSON.stringify(data, null, 2));

  const timetable   = data.timetable   || [];
  const officeHours = data.officeHours || [];

  console.log("timetable count:", timetable.length);
  console.log("officeHours count:", officeHours.length);

  // Single entry
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
  return { meetings: meetings.map(m => m.toJSON()) };
};

export const updateMeetingStatus = async (requestId, status, rescheduledTime = null) => {
  const meeting = await MeetingRequest.findByPk(requestId);
  if (!meeting) { const err = new Error("Meeting not found"); err.statusCode = 404; throw err; }
  await meeting.update({ status, ...(rescheduledTime ? { rescheduled_time: rescheduledTime } : {}) });
  return { meeting: meeting.toJSON() };
};