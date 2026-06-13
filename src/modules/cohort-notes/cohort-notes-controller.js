// src/modules/cohort-notes/cohort-notes-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./cohort-notes-service.js";

export const getNotes   = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getNotes(req.params.cohortId) }));
export const createNote = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.createNote(req.params.cohortId, req.body, { id: req.user.id, name: req.user.name }) }));
export const updateNote = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.updateNote(req.params.cohortId, req.params.noteId, req.body, req.user.id) }));
export const deleteNote = asyncHandler(async (req, res) => { await svc.deleteNote(req.params.cohortId, req.params.noteId, req.user.id, req.user.role); res.json({ success: true, message: "Note deleted" }); });