// src/modules/cohort-board/cohort-board-routes.js

import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as controller from "./cohort-board-controller.js";

const router = express.Router({ mergeParams: true });

router.use(protect);

// ── Posts CRUD ────────────────────────────────────────────────────────────────
router.get("/",          controller.getBoardPosts); // GET  /cohort/:cohortId/posts
router.post("/",         controller.createPost);    // POST /cohort/:cohortId/posts
router.put("/:postId",   controller.updatePost);    // PUT  /cohort/:cohortId/posts/:postId
router.delete("/:postId",controller.deletePost);    // DELETE /cohort/:cohortId/posts/:postId

// ── Like ──────────────────────────────────────────────────────────────────────
router.post("/:postId/like", controller.likePost);  // POST /cohort/:cohortId/posts/:postId/like

// ── Comments ──────────────────────────────────────────────────────────────────
router.post("/:postId/comments",                   controller.addComment);    // POST
router.delete("/:postId/comments/:commentId",      controller.deleteComment); // DELETE

export default router;