// src/modules/cohort-board/cohort-board-service.js

import { Op } from "sequelize";
import { CohortPost, CohortPostLike, CohortPostComment, CohortPostCommentLike } from "./cohort-board-model.js";

// ─── Helper: format time text ─────────────────────────────────────────────────
const formatTimeText = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ─── Helper: transform post → frontend shape ─────────────────────────────────
const transformPost = (post, userId) => {
  const json = post.toJSON ? post.toJSON() : post;
  const likedByUser = (json.likes || []).some((l) => l.user_id === userId);

  return {
    id:           json.id,
    cohortId:     json.cohort_id,
    author:       json.author_name,
    authorAvatar: json.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(json.author_name)}&background=random`,
    title:        json.title,
    content:      json.content,
    type:         json.type || "General",
    cover:        json.cover || null,
    postFor:      json.post_for || "Everyone",
    likes:        json.likes_count,
    comments:     json.comments_count,
    isLiked:      likedByUser,
    timeText:     formatTimeText(json.created_at),
    createdAt:    json.created_at,
    authorId:     json.author_id,
    // Comments included only when fetching single post
    ...(json.comments && {
      comments: json.comments.map((c) => ({
        id:           c.id,
        authorName:   c.author_name,
        authorAvatar: c.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author_name)}&background=random`,
        description:  c.description || "",
        content:      c.content,
        likes:        c.likes_count,
        isLiked:      (c.comment_likes || []).some((l) => l.user_id === userId),
        isEditable:   c.author_id === userId,
        createdAt:    c.created_at,
      })),
    }),
  };
};

// ─── GET all posts for a cohort ───────────────────────────────────────────────
export const getBoardPosts = async (cohortId, userId) => {
  const posts = await CohortPost.findAll({
    where: { cohort_id: cohortId },
    include: [{ model: CohortPostLike, as: "likes", attributes: ["user_id"] }],
    order: [["created_at", "DESC"]],
  });

  return {
    posts: posts.map((p) => transformPost(p, userId)),
    totalPosts: posts.length,
  };
};

// ─── CREATE post ──────────────────────────────────────────────────────────────
export const createPost = async (cohortId, data, author) => {
  if (!data.title?.trim() || !data.content?.trim()) {
    const err = new Error("Title and content are required");
    err.statusCode = 400;
    throw err;
  }

  const post = await CohortPost.create({
    cohort_id:     cohortId,
    author_id:     author.id,
    author_name:   author.name,
    author_avatar: author.avatar || null,
    title:         data.title.trim(),
    content:       data.content.trim(),
    type:          data.postType || data.type || "General",
    cover:         data.coverImage || data.cover || null,
    post_for:      data.postFor || "Everyone",
    likes_count:   0,
    comments_count: 0,
  });

  return transformPost({ ...post.toJSON(), likes: [] }, author.id);
};

// ─── UPDATE post ──────────────────────────────────────────────────────────────
export const updatePost = async (cohortId, postId, data, authorId) => {
  const post = await CohortPost.findOne({ where: { id: postId, cohort_id: cohortId } });

  if (!post) {
    const err = new Error("Post not found");
    err.statusCode = 404;
    throw err;
  }

  if (post.author_id !== authorId) {
    const err = new Error("Not authorized to edit this post");
    err.statusCode = 403;
    throw err;
  }

  await post.update({
    title:    data.title    ?? post.title,
    content:  data.content  ?? post.content,
    type:     data.postType || data.type || post.type,
    cover:    data.coverImage || data.cover || post.cover,
    post_for: data.postFor  ?? post.post_for,
  });

  return transformPost({ ...post.toJSON(), likes: [] }, authorId);
};

// ─── DELETE post ──────────────────────────────────────────────────────────────
export const deletePost = async (cohortId, postId, userId, userRole) => {
  const post = await CohortPost.findOne({ where: { id: postId, cohort_id: cohortId } });

  if (!post) {
    const err = new Error("Post not found");
    err.statusCode = 404;
    throw err;
  }

  if (post.author_id !== userId && userRole !== "admin") {
    const err = new Error("Not authorized to delete this post");
    err.statusCode = 403;
    throw err;
  }

  await post.destroy();
  return { deleted: true };
};

// ─── TOGGLE LIKE post ─────────────────────────────────────────────────────────
export const likePost = async (cohortId, postId, userId) => {
  const post = await CohortPost.findOne({ where: { id: postId, cohort_id: cohortId } });

  if (!post) {
    const err = new Error("Post not found");
    err.statusCode = 404;
    throw err;
  }

  const existing = await CohortPostLike.findOne({ where: { post_id: postId, user_id: userId } });

  if (existing) {
    await existing.destroy();
    await post.update({ likes_count: Math.max(0, post.likes_count - 1) });
    return { liked: false, likes: post.likes_count - 1 };
  } else {
    await CohortPostLike.create({ post_id: postId, user_id: userId });
    await post.update({ likes_count: post.likes_count + 1 });
    return { liked: true, likes: post.likes_count + 1 };
  }
};

// ─── ADD COMMENT ──────────────────────────────────────────────────────────────
export const addComment = async (cohortId, postId, data, author) => {
  const post = await CohortPost.findOne({ where: { id: postId, cohort_id: cohortId } });

  if (!post) {
    const err = new Error("Post not found");
    err.statusCode = 404;
    throw err;
  }

  const comment = await CohortPostComment.create({
    post_id:       postId,
    author_id:     author.id,
    author_name:   author.name,
    author_avatar: author.avatar || null,
    description:   author.role || "",
    content:       data.content,
    likes_count:   0,
  });

  // Use DB count — always accurate
  const count = await CohortPostComment.count({ where: { post_id: postId } });
  await post.update({ comments_count: count });

  return {
    id:           comment.id,
    authorName:   comment.author_name,
    authorAvatar: comment.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author_name)}&background=random`,
    description:  comment.description,
    content:      comment.content,
    likes:        0,
    isLiked:      false,
    isEditable:   true,
    createdAt:    comment.created_at,
  };
};

// ─── DELETE COMMENT ───────────────────────────────────────────────────────────
export const deleteComment = async (cohortId, postId, commentId, userId, userRole) => {
  const post = await CohortPost.findOne({ where: { id: postId, cohort_id: cohortId } });
  if (!post) {
    const err = new Error("Post not found"); err.statusCode = 404; throw err;
  }

  const comment = await CohortPostComment.findOne({ where: { id: commentId, post_id: postId } });
  if (!comment) {
    const err = new Error("Comment not found"); err.statusCode = 404; throw err;
  }

  if (comment.author_id !== userId && userRole !== "admin" && userRole !== "professor") {
    const err = new Error("Not authorized"); err.statusCode = 403; throw err;
  }

  await comment.destroy();
  const count = await CohortPostComment.count({ where: { post_id: postId } });
  await post.update({ comments_count: count });

  return { deleted: true };
};