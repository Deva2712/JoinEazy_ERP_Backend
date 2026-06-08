import { CohortCourse, CourseAttachment, CourseSubmission, CourseComment } from "./cohort-courses-model.js";

// ─── Helper: auto-update status based on deadline ─────────────────────────────
const resolveStatus = (course) => {
  if (!course.deadline) return course.status || "open";
  return new Date(course.deadline) < new Date() ? "closed" : "open";
};

// ─── Helper: build course payload matching frontend MOCK_COURSES shape ─────────
const buildCoursePayload = (course, userId = null) => {
  const c = course.toJSON ? course.toJSON() : course;
  const submissions = c.submissions || [];
  const userSubmission = userId ? submissions.find(s => s.submitted_by === userId) : null;

  return {
    id: c.id,
    title: c.title,
    description: c.description,
    deadline: c.deadline,
    submissionType: c.submission_type,
    status: resolveStatus(c),
    submitted: !!userSubmission,
    submissionCount: submissions.length,
    totalSubmissions: null, // total enrolled — can be populated from cohort members
    isGraded: c.is_graded,
    maxMarks: c.max_marks,
    weightage: c.weightage,
    attachments: (c.attachments || []).map(a => ({ name: a.file_name, size: a.file_size, url: a.file_url })),
    created_at: c.created_at,
    created_by: c.created_by,
  };
};

// ─── GET all courses for a cohort ─────────────────────────────────────────────
export const getCourses = async (cohortId, userId) => {
  const courses = await CohortCourse.findAll({
    where: { cohort_id: cohortId },
    include: [
      { model: CourseAttachment, as: "attachments" },
      { model: CourseSubmission, as: "submissions" },
    ],
    order: [["deadline", "ASC"]],
  });
  return courses.map(c => buildCoursePayload(c, userId));
};

// ─── GET single course ────────────────────────────────────────────────────────
export const getCourseById = async (courseId, userId) => {
  const course = await CohortCourse.findByPk(courseId, {
    include: [
      { model: CourseAttachment, as: "attachments" },
      { model: CourseSubmission, as: "submissions" },
      { model: CourseComment, as: "comments", order: [["created_at", "DESC"]] },
    ],
  });
  if (!course) { const e = new Error("Course not found"); e.statusCode = 404; throw e; }
  return {
    ...buildCoursePayload(course, userId),
    comments: (course.comments || []).map(c => ({
      id: c.id, user_id: c.user_id, user_name: c.user_name, content: c.content, created_at: c.created_at,
      isEditable: c.user_id === userId,
    })),
    submissions: (course.submissions || []).map(s => ({
      id: s.id, submitted_by: s.submitted_by, group_id: s.group_id,
      submission_url: s.submission_url, submission_note: s.submission_note,
      marks_awarded: s.marks_awarded, feedback: s.feedback, submitted_at: s.submitted_at,
    })),
  };
};

// ─── CREATE course ────────────────────────────────────────────────────────────
export const createCourse = async (cohortId, data, userId) => {
  const course = await CohortCourse.create({
    cohort_id: cohortId,
    created_by: userId,
    title: data.title,
    description: data.description || null,
    deadline: data.deadline || null,
    submission_type: data.submissionType || data.submission_type || "Individual",
    is_graded: data.isGraded ?? data.is_graded ?? false,
    max_marks: data.maxMarks ?? data.max_marks ?? null,
    weightage: data.weightage ?? null,
    status: "open",
  });

  // Save attachments if provided (S3 URLs or file names)
  if (data.attachments?.length) {
    const attachmentRecords = data.attachments.map(a => ({
      course_id: course.id,
      file_name: a.name || a.file_name || "attachment",
      file_url: a.url || a.file_url || null,
      file_size: a.size || a.file_size || null,
      file_type: a.type || a.file_type || null,
    }));
    await CourseAttachment.bulkCreate(attachmentRecords);
  }

  return buildCoursePayload(course, userId);
};

// ─── UPDATE course ────────────────────────────────────────────────────────────
export const updateCourse = async (cohortId, courseId, data, userId) => {
  const course = await CohortCourse.findOne({ where: { id: courseId, cohort_id: cohortId } });
  if (!course) { const e = new Error("Course not found"); e.statusCode = 404; throw e; }
  if (course.created_by !== userId) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }

  await course.update({
    title: data.title ?? course.title,
    description: data.description ?? course.description,
    deadline: data.deadline ?? course.deadline,
    submission_type: data.submissionType ?? data.submission_type ?? course.submission_type,
    is_graded: data.isGraded ?? data.is_graded ?? course.is_graded,
    max_marks: data.maxMarks ?? data.max_marks ?? course.max_marks,
    weightage: data.weightage ?? course.weightage,
  });

  return buildCoursePayload(course, userId);
};

// ─── DELETE course ────────────────────────────────────────────────────────────
export const deleteCourse = async (cohortId, courseId, userId) => {
  const course = await CohortCourse.findOne({ where: { id: courseId, cohort_id: cohortId } });
  if (!course) { const e = new Error("Course not found"); e.statusCode = 404; throw e; }
  if (course.created_by !== userId) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }
  await course.destroy();
  return { deleted: true };
};

// ─── SUBMIT a course (student) ────────────────────────────────────────────────
export const submitCourse = async (courseId, userId, data) => {
  const [submission, created] = await CourseSubmission.findOrCreate({
    where: { course_id: courseId, submitted_by: userId },
    defaults: {
      group_id: data.group_id || null,
      submission_url: data.submission_url || null,
      submission_note: data.submission_note || null,
    },
  });
  if (!created) {
    await submission.update({
      submission_url: data.submission_url ?? submission.submission_url,
      submission_note: data.submission_note ?? submission.submission_note,
      submitted_at: new Date(),
    });
  }
  return submission.toJSON();
};

// ─── UNSUBMIT ─────────────────────────────────────────────────────────────────
export const unsubmitCourse = async (courseId, userId) => {
  await CourseSubmission.destroy({ where: { course_id: courseId, submitted_by: userId } });
  return { unsubmitted: true };
};

// ─── GRADE a submission (professor) ───────────────────────────────────────────
export const gradeSubmission = async (courseId, submittedBy, marksAwarded, feedback = null) => {
  const submission = await CourseSubmission.findOne({ where: { course_id: courseId, submitted_by: submittedBy } });
  if (!submission) { const e = new Error("Submission not found"); e.statusCode = 404; throw e; }
  await submission.update({ marks_awarded: marksAwarded, feedback });
  return submission.toJSON();
};

// ─── GET all submissions for a course (professor view) ────────────────────────
export const getSubmissions = async (courseId) => {
  const submissions = await CourseSubmission.findAll({ where: { course_id: courseId } });
  return submissions.map(s => s.toJSON());
};

// ─── Comments ─────────────────────────────────────────────────────────────────
export const addComment = async (courseId, userId, content, userName) => {
  const comment = await CourseComment.create({ course_id: courseId, user_id: userId, user_name: userName, content });
  return comment.toJSON();
};

export const deleteComment = async (commentId, userId) => {
  const comment = await CourseComment.findByPk(commentId);
  if (!comment) { const e = new Error("Comment not found"); e.statusCode = 404; throw e; }
  if (comment.user_id !== userId) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }
  await comment.destroy();
  return { deleted: true };
};
