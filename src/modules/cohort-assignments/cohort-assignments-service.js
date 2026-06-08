// src/modules/cohort-assignments/cohort-assignments-service.js

import { CohortAssignment, AssignmentSubmission } from "./cohort-assignments-model.js";

// ─── Helper: transform to frontend shape ─────────────────────────────────────
const toFrontendShape = (a, currentUserId = null) => {
  const json = a.toJSON ? a.toJSON() : a;
  const submissions = json.submissions || [];

  // Check if current user has submitted
  const mySubmission = currentUserId
    ? submissions.find((s) => s.student_id === currentUserId)
    : null;

  return {
    id:             json.id,
    name:           json.title,        
    title:          json.title,
    description:    json.description,
    deadline:       json.deadline,
    dueDate:        json.deadline,     
    marks:          String(json.marks || "10"), // frontend expects string
    type:           json.type,
    status:         mySubmission ? "submitted" : "pending",  
    submittedAt:    mySubmission ? mySubmission.submitted_at : null, 
    submissions:    submissions,
    created_at:     json.created_at,
    createdAt:      json.created_at,
    cohort_id:      json.cohort_id,
    cohortId:       json.cohort_id,
    submissionLink: json.submission_link || "",
  };
};

// ─── GET all assignments for a cohort ────────────────────────────────────────
export const getAssignments = async (cohortId, currentUserId = null) => {
  const assignments = await CohortAssignment.findAll({
    where: { cohort_id: cohortId },
    include: [
      {
        model: AssignmentSubmission,
        as: "submissions",
        attributes: ["id", "student_id", "student_name", "submitted_at", "marks_awarded", "grade_comments", "group_leader_id"],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return { assignments: assignments.map((a) => toFrontendShape(a, currentUserId)) };
};

// ─── CREATE assignment ────────────────────────────────────────────────────────
export const createAssignment = async (cohortId, data, authorId) => {
  const assignment = await CohortAssignment.create({
    cohort_id:       cohortId,
    author_id:       authorId,
    title:           data.title || data.name,
    description:     data.description || null,
    type:            data.type || "individual",
    deadline:        data.deadline || null,
    marks:           data.marks || 10,
    submission_link: data.submissionLink || data.submission_link || null,
  });

  return toFrontendShape({ ...assignment.toJSON(), submissions: [] });
};

// ─── UPDATE assignment ────────────────────────────────────────────────────────
export const updateAssignment = async (cohortId, assignmentId, data, authorId) => {
  const assignment = await CohortAssignment.findOne({
    where: { id: assignmentId, cohort_id: cohortId },
  });

  if (!assignment) {
    const err = new Error("Assignment not found"); err.statusCode = 404; throw err;
  }
  if (assignment.author_id !== authorId) {
    const err = new Error("Not authorized"); err.statusCode = 403; throw err;
  }

  await assignment.update({
    title:           data.title ?? data.name ?? assignment.title,
    description:     data.description ?? assignment.description,
    type:            data.type ?? assignment.type,
    deadline:        data.deadline ?? assignment.deadline,
    marks:           data.marks ?? assignment.marks,
    submission_link: data.submissionLink ?? data.submission_link ?? assignment.submission_link,
  });

  return toFrontendShape({ ...assignment.toJSON(), submissions: [] });
};

// ─── DELETE assignment ────────────────────────────────────────────────────────
export const deleteAssignment = async (cohortId, assignmentId, authorId, userRole) => {
  const assignment = await CohortAssignment.findOne({
    where: { id: assignmentId, cohort_id: cohortId },
  });

  if (!assignment) {
    const err = new Error("Assignment not found"); err.statusCode = 404; throw err;
  }
  if (assignment.author_id !== authorId && userRole !== "admin") {
    const err = new Error("Not authorized"); err.statusCode = 403; throw err;
  }

  await assignment.destroy();
  return { deleted: true };
};

// ─── SUBMIT assignment ────────────────────────────────────────────────────────
export const submitAssignment = async (cohortId, assignmentId, student) => {
  const assignment = await CohortAssignment.findOne({
    where: { id: assignmentId, cohort_id: cohortId },
  });

  if (!assignment) {
    const err = new Error("Assignment not found"); err.statusCode = 404; throw err;
  }

  const [submission, created] = await AssignmentSubmission.findOrCreate({
    where: { assignment_id: assignmentId, student_id: student.id },
    defaults: { student_name: student.name, submitted_at: new Date() },
  });

  return { submission: submission.toJSON(), already_submitted: !created };
};

// ─── UNSUBMIT assignment ──────────────────────────────────────────────────────
export const unsubmitAssignment = async (cohortId, assignmentId, studentId) => {
  const submission = await AssignmentSubmission.findOne({
    where: { assignment_id: assignmentId, student_id: studentId },
  });

  if (!submission) {
    const err = new Error("Submission not found"); err.statusCode = 404; throw err;
  }

  await submission.destroy();
  return { deleted: true };
};

// ─── GET submission status ────────────────────────────────────────────────────
export const getSubmissionStatus = async (cohortId, studentId, assignmentIds = null) => {
  const { Op } = await import("sequelize");
  const where = { student_id: studentId };

  if (assignmentIds && assignmentIds.length > 0) {
    where.assignment_id = { [Op.in]: assignmentIds };
  } else {
    const cohortAssignments = await CohortAssignment.findAll({
      where: { cohort_id: cohortId },
      attributes: ["id"],
    });
    where.assignment_id = { [Op.in]: cohortAssignments.map((a) => a.id) };
  }

  const submissions = await AssignmentSubmission.findAll({ where });

  const statusMap = {};
  submissions.forEach((s) => {
    statusMap[s.assignment_id] = {
      submitted:     true,
      submitted_at:  s.submitted_at,
      marks_awarded: s.marks_awarded,
    };
  });
  return statusMap;
};

// ─── GET all submissions (professor) ─────────────────────────────────────────
export const getAssignmentSubmissions = async (cohortId, assignmentId) => {
  const assignment = await CohortAssignment.findOne({
    where: { id: assignmentId, cohort_id: cohortId },
  });

  if (!assignment) {
    const err = new Error("Assignment not found"); err.statusCode = 404; throw err;
  }

  const submissions = await AssignmentSubmission.findAll({
    where: { assignment_id: assignmentId },
    order: [["submitted_at", "DESC"]],
  });

  return submissions.map((s) => s.toJSON());
};

// ─── GRADE assignment ─────────────────────────────────────────────────────────
export const gradeAssignment = async (assignmentId, studentId, marksAwarded, comments = "") => {
  const submission = await AssignmentSubmission.findOne({
    where: { assignment_id: assignmentId, student_id: studentId },
  });

  if (!submission) {
    const err = new Error("Submission not found"); err.statusCode = 404; throw err;
  }

  await submission.update({ marks_awarded: marksAwarded, grade_comments: comments });
  return submission.toJSON();
};