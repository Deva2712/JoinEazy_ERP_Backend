import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as ctrl from "./cohort-events-controller.js";

const router = express.Router({ mergeParams: true });
router.use(protect);


router.get("/", ctrl.getEvents);

// GET single event by id
router.get("/:eventId", ctrl.getEventById);

// CREATE event
router.post("/", ctrl.createEvent);

// UPDATE event
router.put("/:eventId", ctrl.updateEvent);

// DELETE event
router.delete("/:eventId", ctrl.deleteEvent);

// RSVP going status
router.post("/:eventId/going", ctrl.updateGoingStatus);

// Approve/reject a requested event (professor only)
router.post("/:eventId/request-action", ctrl.handleEventRequest);

// Comments
router.post("/:eventId/comments", ctrl.addComment);
router.delete("/:eventId/comments/:commentId", ctrl.deleteComment);

export default router;
