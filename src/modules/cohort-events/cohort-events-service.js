import { Op } from "sequelize";
import { CohortEvent, EventAttendee, EventComment } from "./cohort-events-model.js";

// ─── Helper: auto-sync status based on date ───────────────────────────────────
const resolveStatus = (event) => {
  if (event.status === "requested" || event.status === "cancelled") return event.status;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(event.date);
  return eventDate < today ? "past" : "upcoming";
};

// ─── Helper: build event payload matching frontend shape ───────────────────────
const buildEventPayload = (event, userId = null) => {
  const e = event.toJSON ? event.toJSON() : event;
  const attendees = e.attendees || [];
  const going = attendees.filter(a => a.status === "going").length;
  const notGoing = attendees.filter(a => a.status === "not_going").length;
  const maybe = attendees.filter(a => a.status === "maybe").length;
  const userAttendee = userId ? attendees.find(a => a.user_id === userId) : null;

  return {
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.date,
    startTime: e.start_time,
    endTime: e.end_time,
    timezone: e.timezone || "IST",
    location: e.location,
    type: resolveStatus(e),
    status: e.status === "requested" ? "pending" : "confirmed",
    isEditable: e.created_by === userId,
    participants: e.participants_scope || "Everyone",
    organizer: {
      user_id: e.created_by,
      name: e.created_by_name || "Professor",
      description: "Instructor",
      avatar: null,
    },
    attendees: attendees.length,
    maxAttendees: e.max_attendees || null,
    userGoingStatus: userAttendee
      ? (userAttendee.status === "going" ? "Going" : userAttendee.status === "not_going" ? "Not Going" : "Maybe")
      : null,
    goingStats: { going, notGoing, dontKnow: maybe },
    created_at: e.created_at,
  };
};

// ─── GET events — returns { Upcoming, Past, Requested } ───────────────────────
export const getEvents = async (cohortId, userId) => {
  const events = await CohortEvent.findAll({
    where: { cohort_id: cohortId, status: { [Op.ne]: "cancelled" } },
    include: [{ model: EventAttendee, as: "attendees" }],
    order: [["date", "ASC"]],
  });

  const result = { Upcoming: [], Past: [], Requested: [] };
  for (const ev of events) {
    const status = resolveStatus(ev);
    const payload = buildEventPayload(ev, userId);
    if (status === "upcoming") result.Upcoming.push(payload);
    else if (status === "past") result.Past.push(payload);
    else if (status === "requested") result.Requested.push(payload);
  }
  return result;
};

// ─── GET single event ──────────────────────────────────────────────────────────
export const getEventById = async (eventId, userId) => {
  const ev = await CohortEvent.findByPk(eventId, {
    include: [
      { model: EventAttendee, as: "attendees" },
      { model: EventComment, as: "comments", order: [["created_at", "DESC"]] },
    ],
  });
  if (!ev) { const e = new Error("Event not found"); e.statusCode = 404; throw e; }
  return {
    ...buildEventPayload(ev, userId),
    comments: (ev.comments || []).map(c => ({
      id: c.id,
      authorName: c.user_name,
      authorAvatar: c.user_avatar,
      description: c.user_description,
      content: c.content,
      likes: c.likes,
      isLiked: false,
      isEditable: c.user_id === userId,
      created_at: c.created_at,
    })),
  };
};

// ─── CREATE event ──────────────────────────────────────────────────────────────
export const createEvent = async (cohortId, data, userId, userName) => {
  const ev = await CohortEvent.create({
    cohort_id: cohortId,
    created_by: userId,
    created_by_name: userName || data.created_by_name || null,
    title: data.title,
    description: data.description || null,
    location: data.location || null,
    date: data.date || data.event_date,
    start_time: data.startTime || data.start_time || null,
    end_time: data.endTime || data.end_time || null,
    timezone: data.timezone || "IST",
    status: data.isRequestMode ? "requested" : "upcoming",
    participants_scope: data.selectedParticipant || data.participants_scope || "Everyone",
    target_member_id: data.selectedMemberId || data.target_member_id || null,
    target_group_id: data.selectedGroupId || data.target_group_id || null,
    max_attendees: data.max_attendees || null,
    is_editable: true,
  });
  return buildEventPayload(ev, userId);
};

// ─── UPDATE event ──────────────────────────────────────────────────────────────
export const updateEvent = async (cohortId, eventId, data, userId) => {
  const ev = await CohortEvent.findOne({ where: { id: eventId, cohort_id: cohortId } });
  if (!ev) { const e = new Error("Event not found"); e.statusCode = 404; throw e; }
  if (ev.created_by !== userId) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }
  await ev.update({
    title: data.title ?? ev.title,
    description: data.description ?? ev.description,
    location: data.location ?? ev.location,
    date: data.date ?? data.event_date ?? ev.date,
    start_time: data.startTime ?? data.start_time ?? ev.start_time,
    end_time: data.endTime ?? data.end_time ?? ev.end_time,
    timezone: data.timezone ?? ev.timezone,
    participants_scope: data.selectedParticipant ?? data.participants_scope ?? ev.participants_scope,
    target_member_id: data.selectedMemberId ?? ev.target_member_id,
    target_group_id: data.selectedGroupId ?? ev.target_group_id,
  });
  return buildEventPayload(ev, userId);
};

// ─── DELETE event ──────────────────────────────────────────────────────────────
export const deleteEvent = async (cohortId, eventId, userId) => {
  const ev = await CohortEvent.findOne({ where: { id: eventId, cohort_id: cohortId } });
  if (!ev) { const e = new Error("Event not found"); e.statusCode = 404; throw e; }
  if (ev.created_by !== userId) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }
  await ev.destroy();
  return { deleted: true };
};

// ─── RSVP / Going status ───────────────────────────────────────────────────────
export const updateGoingStatus = async (eventId, userId, status) => {
  const normalized = status?.toLowerCase().replace(" ", "_"); // "Going" → "going"
  const validStatus = ["going", "not_going", "maybe"].includes(normalized) ? normalized : "going";
  const [record, created] = await EventAttendee.findOrCreate({
    where: { event_id: eventId, user_id: userId },
    defaults: { status: validStatus },
  });
  if (!created) await record.update({ status: validStatus });
  return { status: validStatus };
};

// ─── Handle request (approve/reject) ─────────────────────────────────────────
export const handleEventRequest = async (eventId, action, cohortId, location = null) => {
  const ev = await CohortEvent.findByPk(eventId);
  if (!ev) { const e = new Error("Event not found"); e.statusCode = 404; throw e; }
  if (action === "approve") {
    await ev.update({ status: "upcoming", location: location ?? ev.location });
  } else {
    await ev.update({ status: "cancelled" });
  }
  return { action, event_id: eventId };
};

// ─── Comments ─────────────────────────────────────────────────────────────────
export const addComment = async (eventId, userId, data) => {
  const comment = await EventComment.create({
    event_id: eventId,
    user_id: userId,
    user_name: data.user_name || data.authorName || null,
    user_avatar: data.user_avatar || null,
    user_description: data.user_description || null,
    content: data.content,
  });
  return { id: comment.id, authorName: comment.user_name, content: comment.content,
    likes: 0, isLiked: false, isEditable: true, created_at: comment.created_at };
};

export const deleteComment = async (commentId, userId) => {
  const comment = await EventComment.findByPk(commentId);
  if (!comment) { const e = new Error("Comment not found"); e.statusCode = 404; throw e; }
  if (comment.user_id !== userId) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }
  await comment.destroy();
  return { deleted: true };
};
