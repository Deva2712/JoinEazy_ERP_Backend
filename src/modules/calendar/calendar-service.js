import { CalendarEvent } from "./calendar-model.js";
import { Op } from "sequelize";

const fmt = (e) => ({
  ...e.toJSON(),
  startTime: e.start_time,
  endTime:   e.end_time,
  createdAt: e.created_at,
});

// GET events — optionally filter by type
export const getEvents = async (userId, type = null) => {
  const where = { user_id: userId };
  if (type && type !== "all") where.type = type;

  const events = await CalendarEvent.findAll({
    where,
    order: [["date", "ASC"], ["start_time", "ASC"]],
  });
  return events.map(fmt);
};

// CREATE personal event
export const createEvent = async (userId, data) => {
  const event = await CalendarEvent.create({
    user_id:     userId,
    title:       data.title,
    date:        data.date,
    type:        data.type || "personal",
    description: data.description || null,
    start_time:  data.startTime || data.start_time || null,
    end_time:    data.endTime   || data.end_time   || null,
    location:    data.location  || null,
    is_all_day:  data.isAllDay  || false,
    source:      "personal",
    cohort_id:   null,
  });
  return fmt(event);
};

// DELETE event
export const deleteEvent = async (eventId, userId) => {
  const event = await CalendarEvent.findOne({ where: { id: eventId, user_id: userId } });
  if (!event) { const e = new Error("Event not found"); e.statusCode = 404; throw e; }
  await event.destroy();
  return { deleted: true };
};

// Helper: sync cohort events to user calendar (called internally)
export const syncCohortEventToCalendar = async (userId, cohortEvent) => {
  await CalendarEvent.findOrCreate({
    where: { user_id: userId, cohort_id: cohortEvent.cohort_id, title: cohortEvent.title, date: cohortEvent.date },
    defaults: {
      user_id:    userId,
      title:      cohortEvent.title,
      date:       cohortEvent.date,
      type:       "meeting",
      description:cohortEvent.description || null,
      start_time: cohortEvent.start_time  || null,
      end_time:   cohortEvent.end_time    || null,
      location:   cohortEvent.location    || null,
      source:     "cohort",
      cohort_id:  cohortEvent.cohort_id,
    },
  });
};