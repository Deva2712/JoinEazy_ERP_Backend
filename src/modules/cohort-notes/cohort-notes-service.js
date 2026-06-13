// src/modules/cohort-notes/cohort-notes-service.js
import CohortNote from "./cohort-notes-model.js";

export const getNotes = async (cohortId) => {
  const notes = await CohortNote.findAll({
    where: { cohort_id: cohortId },
    order: [["is_pinned", "DESC"], ["created_at", "DESC"]],
  });
  return notes.map((n) => n.toJSON());
};

export const createNote = async (cohortId, data, author) => {
  const note = await CohortNote.create({
    cohort_id:   cohortId,
    author_id:   author.id,
    author_name: author.name,
    title:       data.title,
    content:     data.content || "",
    color:       data.color || "#ffffff",
    is_pinned:   data.is_pinned || false,
  });
  return note.toJSON();
};

export const updateNote = async (cohortId, noteId, data, authorId) => {
  const note = await CohortNote.findOne({ where: { id: noteId, cohort_id: cohortId } });
  if (!note) { const e = new Error("Note not found"); e.statusCode = 404; throw e; }
  if (note.author_id !== authorId) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }
  await note.update({
    title:     data.title     ?? note.title,
    content:   data.content   ?? note.content,
    color:     data.color     ?? note.color,
    is_pinned: data.is_pinned ?? note.is_pinned,
  });
  return note.toJSON();
};

export const deleteNote = async (cohortId, noteId, authorId, userRole) => {
  const note = await CohortNote.findOne({ where: { id: noteId, cohort_id: cohortId } });
  if (!note) { const e = new Error("Note not found"); e.statusCode = 404; throw e; }
  if (note.author_id !== authorId && userRole !== "admin") { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }
  await note.destroy();
  return { deleted: true };
};