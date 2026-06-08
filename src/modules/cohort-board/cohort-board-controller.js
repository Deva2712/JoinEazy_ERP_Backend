// src/modules/cohort-board/cohort-board-controller.js

import { asyncHandler } from "../../middleware/error.middleware.js";
import * as service from "./cohort-board-service.js";


// GET /cohort/:cohortId/posts
export const getBoardPosts = asyncHandler(async (req, res) => {
  const { cohortId } = req.params;
  const data = await service.getBoardPosts(cohortId, req.user.id);
  res.status(200).json({ success: true, data });
});


// POST /cohort/:cohortId/posts
export const createPost = asyncHandler(async (req, res) => {
  const { cohortId } = req.params;
  const author = { id: req.user.id, name: req.user.name, avatar: req.user.avatar, role: req.user.role };
  const data = await service.createPost(cohortId, req.body, author);
  res.status(201).json({ success: true, data });
});


// PUT /cohort/:cohortId/posts/:postId
export const updatePost = asyncHandler(async (req, res) => {
  const { cohortId, postId } = req.params;
  const data = await service.updatePost(cohortId, postId, req.body, req.user.id);
  res.status(200).json({ success: true, data });
});


// DELETE /cohort/:cohortId/posts/:postId
export const deletePost = asyncHandler(async (req, res) => {
  const { cohortId, postId } = req.params;
  await service.deletePost(cohortId, postId, req.user.id, req.user.role);
  res.status(200).json({ success: true, message: "Post deleted" });
});


// POST /cohort/:cohortId/posts/:postId/like
export const likePost = asyncHandler(async (req, res) => {
  const { cohortId, postId } = req.params;
  const data = await service.likePost(cohortId, postId, req.user.id);
  res.status(200).json({ success: true, data });
});


// POST /cohort/:cohortId/posts/:postId/comments
export const addComment = asyncHandler(async (req, res) => {
  const { cohortId, postId } = req.params;
  const author = { id: req.user.id, name: req.user.name, avatar: req.user.avatar, role: req.user.role };
  const data = await service.addComment(cohortId, postId, req.body, author);
  res.status(201).json({ success: true, data });
});


// DELETE /cohort/:cohortId/posts/:postId/comments/:commentId
export const deleteComment = asyncHandler(async (req, res) => {
  const { cohortId, postId, commentId } = req.params;
  await service.deleteComment(cohortId, postId, commentId, req.user.id, req.user.role);
  res.status(200).json({ success: true, message: "Comment deleted" });
});