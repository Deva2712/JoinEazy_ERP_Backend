// src/modules/cohort-assignments/cohort-assignments-service.js
import { CohortAssignment, AssignmentSubmission } from "./cohort-assignments-model.js";
import { notify } from "../../utils/notification-helper.js";
import { addJobToMany } from "../../utils/job-tray-helper.js";
import { JobTrayItem } from "../job-tray/job-tray-model.js";
import CohortMember from "../cohort-members/cohort-members-model.js";

// GET /cohort/:cohortId/assignments
export const getAssignments = async (cohortId, studentId = null) => {
  const rows = await CohortAssignment.findAll({
    where: { cohort_id: String(cohortId) },
    include: [{ model: AssignmentSubmission, as: "submissions", attributes: ["id", "student_id", "grade", "submitted_at", "link", "note"] }],
    order: [["deadline", "ASC"]],
  });

  const assignments = rows.map((a) => {
    const json = a.toJSON();
    const mySubmission = studentId
      ? json.submissions?.find((s) => String(s.student_id) === String(studentId))
      : null;

    return {
      ...json,
      name:           json.title,
      submissionLink: json.submission_link,
      isSubmitted:    !!mySubmission,
      submittedAt:    mySubmission?.submitted_at || null,
      submittedLink:  mySubmission?.link || null,
      grade:          mySubmission?.grade || null,
    };
  });

  return { assignments };
};

// POST /cohort/:cohortId/assignments
export const createAssignment = async (cohortId, body, userId) => {
  const assignment = await CohortAssignment.create({
    cohort_id:       String(cohortId),
    title:           body.name || body.title,
    description:     body.description || null,
    deadline:        body.deadline || null,
    marks:           body.marks || "10",
    type:            body.type || "individual",
    submission_link: body.submissionLink || null,
    created_by:      userId,
  });

  // FIX (functional gap): new assignments never showed up anywhere as an actionable
  // pending task — students only found out by opening the assignments tab themselves.
  const students = await CohortMember.findAll({ where: { cohort_id: String(cohortId), role: "student" } });
  await addJobToMany(students.map((s) => s.user_id), {
    type: "assignment",
    title: `New assignment: ${assignment.title}`,
    message: assignment.deadline ? `Due ${new Date(assignment.deadline).toDateString()}.` : null,
    link: "/cohort/assignments",
  });

  return assignment.toJSON();
};

// PUT /cohort/:cohortId/assignments/:assignmentId
export const updateAssignment = async (cohortId, assignmentId, body) => {
  const assignment = await CohortAssignment.findOne({ where: { id: assignmentId, cohort_id: String(cohortId) } });
  if (!assignment) { const e = new Error("Assignment not found"); e.statusCode = 404; throw e; }
  await assignment.update({
    title:           body.name || body.title || assignment.title,
    description:     body.description ?? assignment.description,
    deadline:        body.deadline ?? assignment.deadline,
    marks:           body.marks ?? assignment.marks,
    type:            body.type ?? assignment.type,
    submission_link: body.submissionLink ?? assignment.submission_link,
  });
  return assignment.toJSON();
};

// DELETE /cohort/:cohortId/assignments/:assignmentId
export const deleteAssignment = async (cohortId, assignmentId) => {
  const assignment = await CohortAssignment.findOne({ where: { id: assignmentId, cohort_id: String(cohortId) } });
  if (!assignment) { const e = new Error("Assignment not found"); e.statusCode = 404; throw e; }
  await assignment.destroy();
  return { deleted: true };
};

// POST /cohort/assignments/:assignmentId/grade
export const gradeSubmission = async (assignmentId, body) => {
  const submission = await AssignmentSubmission.findOne({ where: { id: body.submissionId, assignment_id: assignmentId } });
  if (!submission) { const e = new Error("Submission not found"); e.statusCode = 404; throw e; }
  await submission.update({ grade: body.grade });

  const assignment = await CohortAssignment.findByPk(assignmentId, { attributes: ["title"] });
  await notify(submission.student_id, {
    title: "Assignment Graded",
    message: `Your submission for "${assignment?.title || "an assignment"}" has been graded: ${body.grade}.`,
    type: "GENERAL",
    link: "/cohort/assignments",
  });

  return submission.toJSON();
};

export const getSubmissionStatus = async (cohortId, userId, assignmentIds = null) => {
  const where = { student_id: userId };
  if (assignmentIds) where.assignment_id = assignmentIds;
  const subs = await AssignmentSubmission.findAll({ where, attributes: ["assignment_id", "grade", "submitted_at", "link"] });
  return { submissions: subs.map(s => s.toJSON()) };
};

export const getAssignmentSubmissions = async (cohortId, assignmentId) => {
  const submissions = await AssignmentSubmission.findAll({
    where: { assignment_id: assignmentId },
    order: [["submitted_at", "DESC"]],
  });
  return submissions.map((s) => s.toJSON());
};

// POST /cohort/:cohortId/assignments/:assignmentId/submit
export const submitAssignment = async (cohortId, assignmentId, student, body = {}, fileUrl = null) => {
  const [submission, created] = await AssignmentSubmission.findOrCreate({
    where: { assignment_id: assignmentId, student_id: student.id },
    defaults: {
      student_name: student.name,
      submitted_at: new Date(),
      link: fileUrl || body.link || null,
      note: body.note || null,
    },
  });

  if (!created) {
    await submission.update({
      submitted_at: new Date(),
      link: fileUrl || body.link || submission.link,
      note: body.note || submission.note,
    });
  }

  // Submission fulfilled the pending task — close out the matching job-tray item.
  const assignment = await CohortAssignment.findByPk(assignmentId, { attributes: ["title"] });
  if (assignment) {
    await JobTrayItem.update(
      { status: "completed" },
      { where: { user_id: String(student.id), type: "assignment", title: `New assignment: ${assignment.title}`, status: "pending" } },
    );
  }

  return { submission: submission.toJSON(), already_submitted: !created };
};

export const unsubmitAssignment = async (cohortId, assignmentId, studentId) => {
  const submission = await AssignmentSubmission.findOne({
    where: { assignment_id: assignmentId, student_id: studentId },
  });
  if (!submission) { const e = new Error("Submission not found"); e.statusCode = 404; throw e; }
  await submission.destroy();
  return { deleted: true };
};