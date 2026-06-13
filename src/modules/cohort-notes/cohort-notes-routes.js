// src/modules/cohort-notes/cohort-notes-routes.js
import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as ctrl from "./cohort-notes-controller.js";

const router = express.Router({ mergeParams: true });
router.use(protect);

router.get("/",           ctrl.getNotes);    // GET    /cohort/:cohortId/notes
router.post("/",          ctrl.createNote);  // POST   /cohort/:cohortId/notes
router.put("/:noteId",    ctrl.updateNote);  // PUT    /cohort/:cohortId/notes/:noteId
router.delete("/:noteId", ctrl.deleteNote);  // DELETE /cohort/:cohortId/notes/:noteId

export default router;