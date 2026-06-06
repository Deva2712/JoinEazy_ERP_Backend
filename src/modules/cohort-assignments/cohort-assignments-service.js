// src/modules/cohort-assignments/cohort-assignments-service.js

import { CohortAssignment, AssignmentSubmission } from "./cohort-assignments-model.js";

// ─── GET all assignments for a cohort ────────────────────────────────────────
export const getAssignments = async (cohortId) => {
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

  return { assignments: assignments.map((a) => a.toJSON()) };
};

// ─── CREATE assignment ────────────────────────────────────────────────────────
export const createAssignment = async (cohortId, data, authorId) => {
  const assignment = await CohortAssignment.create({
    cohort_id: cohortId,
    author_id: authorId,
    title: data.title || data.name,
    description: data.description || null,
    type: data.type || "individual",
    deadline: data.deadline || null,
    marks: data.marks || 10,
    submission_link: data.submissionLink || data.submission_link || null,
  });

  return assignment.toJSON();
};

// ─── UPDATE assignment ────────────────────────────────────────────────────────
export const updateAssignment = async (cohortId, assignmentId, data, authorId) => {
  const assignment = await CohortAssignment.findOne({
    where: { id: assignmentId, cohort_id: cohortId },
  });

  if (!assignment) {
    const err = new Error("Assignment not found");
    err.statusCode = 404;
    throw err;
  }

  if (assignment.author_id !== authorId) {
    const err = new Error("Not authorized to edit this assignment");
    err.statusCode = 403;
    throw err;
  }

  await assignment.update({
    title:           data.title ?? data.name ?? assignment.title,
    description:     data.description ?? assignment.description,
    type:            data.type ?? assignment.type,
    deadline:        data.deadline ?? assignment.deadline,
    marks:           data.marks ?? assignment.marks,
    submission_link: data.submissionLink ?? data.submission_link ?? assignment.submission_link,
  });

  return assignment.toJSON();
};

// ─── DELETE assignment ────────────────────────────────────────────────────────
export const deleteAssignment = async (cohortId, assignmentId, authorId, userRole) => {
  const assignment = await CohortAssignment.findOne({
    where: { id: assignmentId, cohort_id: cohortId },
  });

  if (!assignment) {
    const err = new Error("Assignment not found");
    err.statusCode = 404;
    throw err;
  }

  if (assignment.author_id !== authorId && userRole !== "admin") {
    const err = new Error("Not authorized to delete this assignment");
    err.statusCode = 403;
    throw err;
  }

  await assignment.destroy();
  return { deleted: true };
};

// ─── SUBMIT assignment (student marks as submitted) ───────────────────────────
export const submitAssignment = async (cohortId, assignmentId, student) => {
  const assignment = await CohortAssignment.findOne({
    where: { id: assignmentId, cohort_id: cohortId },
  });

  if (!assignment) {
    const err = new Error("Assignment not found");
    err.statusCode = 404;
    throw err;
  }

  const [submission, created] = await AssignmentSubmission.findOrCreate({
    where: { assignment_id: assignmentId, student_id: student.id },
    defaults: {
      student_name: student.name,
      submitted_at: new Date(),
    },
  });

  return { submission: submission.toJSON(), already_submitted: !created };
};

// ─── UNSUBMIT assignment ──────────────────────────────────────────────────────
export const unsubmitAssignment = async (cohortId, assignmentId, studentId) => {
  const submission = await AssignmentSubmission.findOne({
    where: { assignment_id: assignmentId, student_id: studentId },
  });

  if (!submission) {
    const err = new Error("Submission not found");
    err.statusCode = 404;
    throw err;
  }

  await submission.destroy();
  return { deleted: true };
};

// ─── GET submission status for current user ───────────────────────────────────
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
      submitted: true,
      submitted_at: s.submitted_at,
      marks_awarded: s.marks_awarded,
    };
  });
  return statusMap;
};

// ─── GET all submissions for an assignment (professor view) ───────────────────
export const getAssignmentSubmissions = async (cohortId, assignmentId) => {
  const assignment = await CohortAssignment.findOne({
    where: { id: assignmentId, cohort_id: cohortId },
  });

  if (!assignment) {
    const err = new Error("Assignment not found");
    err.statusCode = 404;
    throw err;
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
    const err = new Error("Submission not found");
    err.statusCode = 404;
    throw err;
  }

  await submission.update({ marks_awarded: marksAwarded, grade_comments: comments });
  return submission.toJSON();
};
