// src/modules/profmentoring/profmentoring-service.js
import { Op } from "sequelize";
import { ProfMentoringSession } from "./profmentoring-model.js";
import { MentorAssignment } from "../mentoring/mentoring-model.js";
import User from "../auth/auth-model.js";

// ─── Formatter: session → MeetingsLogSection shape ───────────────────────────
const fmtMeetingHistory = (s) => {
  const j = s.toJSON ? s.toJSON() : s;
  return {
    meetingId:         j.id,
    date:              j.scheduled_at,
    status:            j.status === "pending"   ? "Requested"
                     : j.status === "accepted"  ? "Pending Documentation"
                     : j.status === "completed" ? "Completed"
                     : j.status.charAt(0).toUpperCase() + j.status.slice(1),
    hasAttended:       j.has_attended ?? null,
    discussionSummary: j.discussion_summary || null,
    mode:              j.mode  || "Offline",
    notes:             j.notes || null,
  };
};

// ─── Formatter: User → StudentCard / StudentDetailsView shape ─────────────────
const fmtMentee = (u, sessions) => {
  const user = u.toJSON ? u.toJSON() : u;
  return {
    studentId:     user.id,
    name:          user.name          || "",
    emailId:       user.email         || "",
    phoneNumber:   user.mobileNumber  || user.phone || "",
    department:    user.department    || "",
    semester:      user.semester      || user.current_semester || "",
    studentType:   user.student_type  || "",
    academicMetrics: {
      cgpa:               user.cgpa               || 0,
      attendance:         user.attendance          || 0,
      backlogs:           user.backlogs            || 0,
      backlogHistory:     user.backlog_history     || [],
      semesterGrades:     user.semester_grades     || [],
      semesterAttendance: user.semester_attendance || [],
    },
    meetingHistory: sessions.map(fmtMeetingHistory),
    behavioralLogs: user.behavioral_logs || {
      participationLevel: "N/A",
      activityHistory: [],
    },
  };
};

// ─── GET /profmentoring/mentees ───────────────────────────────────────────────
// MentoringController → mentoringService.getAssignedMentees()
//
// Source of truth is MentorAssignment (admin/HOD assigns students to a
// professor). This means a student shows up here as soon as they're
// assigned — no meeting needs to have happened yet. Sessions are only used
// to attach meeting history on top of that.
export const getAssignedMentees = async (profId) => {
  const assignments = await MentorAssignment.findAll({
    where: { mentor_id: profId, is_active: true },
  });

  const menteeIds = assignments.map(a => a.student_id);
  if (!menteeIds.length) return [];

  const sessions = await ProfMentoringSession.findAll({
    where:  { mentor_id: profId, mentee_id: menteeIds },
    order:  [["scheduled_at", "DESC"]],
  });

  // Group sessions by mentee_id
  const sessionMap = {};
  for (const s of sessions) {
    if (!sessionMap[s.mentee_id]) sessionMap[s.mentee_id] = [];
    sessionMap[s.mentee_id].push(s);
  }

  const menteeUsers = await User.findAll({
    where:      { id: menteeIds },
    attributes: [
      "id", "name", "email", "department", "mobileNumber",
      "semester", "student_type", "cgpa", "attendance",
      "backlogs", "backlog_history", "semester_grades", "semester_attendance",
    ],
  });

  return menteeUsers.map(u => fmtMentee(u, sessionMap[u.id] || []));
};

// ─── POST /profmentoring/assign ───────────────────────────────────────────────
// Admin/HOD assigns a student to a professor as their mentor.
// Deactivates any previous active assignment for that student first, so a
// student only ever has ONE active mentor at a time.
export const assignMentor = async (studentId, mentorId, assignedBy) => {
  const student = await User.findOne({ where: { id: studentId, role: "student" } });
  if (!student) throw Object.assign(new Error("Student not found"), { statusCode: 404 });

  const mentor = await User.findOne({ where: { id: mentorId, role: "professor" } });
  if (!mentor) throw Object.assign(new Error("Professor not found"), { statusCode: 404 });

  await MentorAssignment.update(
    { is_active: false },
    { where: { student_id: studentId, is_active: true } },
  );

  const assignment = await MentorAssignment.create({
    student_id:  studentId,
    mentor_id:   mentorId,
    assigned_by: assignedBy || null,
  });

  return {
    id:        assignment.id,
    studentId: student.id,
    studentName: student.name,
    mentorId:  mentor.id,
    mentorName: mentor.name,
    assignedAt: assignment.assigned_at,
  };
};

// ─── GET /profmentoring/unassigned-students ───────────────────────────────────
// Helper for the admin/HOD "assign a mentor" screen.
export const getUnassignedStudents = async () => {
  const activeAssignments = await MentorAssignment.findAll({ where: { is_active: true } });
  const assignedIds = activeAssignments.map(a => a.student_id);

  const students = await User.findAll({
    where: assignedIds.length
      ? { role: "student", id: { [Op.notIn]: assignedIds } }
      : { role: "student" },
    attributes: ["id", "name", "email", "department", "semester"],
  });

  return students;
};

// ─── PATCH /profmentoring/meetings/:meetingId/attendance ──────────────────────
// MentoringController → mentoringService.updateMeetingAttendance()
export const updateMeetingAttendance = async (meetingId, profId, data) => {
  const session = await ProfMentoringSession.findByPk(meetingId);
  if (!session) { const e = new Error("Meeting not found"); e.statusCode = 404; throw e; }
  if (String(session.mentor_id) !== String(profId)) {
    const e = new Error("Not authorized"); e.statusCode = 403; throw e;
  }
  await session.update({
    has_attended: data.hasAttended,
    status:       data.hasAttended !== null ? "completed" : session.status,
  });
  return fmtMeetingHistory(session);
};

// ─── POST /profmentoring/meetings/:meetingId/notes ────────────────────────────
// MentoringController → mentoringService.submitMeetingNotes()
export const submitMeetingNotes = async (meetingId, profId, data) => {
  const session = await ProfMentoringSession.findByPk(meetingId);
  if (!session) { const e = new Error("Meeting not found"); e.statusCode = 404; throw e; }
  if (String(session.mentor_id) !== String(profId)) {
    const e = new Error("Not authorized"); e.statusCode = 403; throw e;
  }
  await session.update({
    discussion_summary:  data.summary            || data.discussionSummary || null,
    action_plan:         data.actionPlan         || null,
    performance_ratings: data.performanceRatings || null,
    overall_remarks:     data.overallRemarks     || null,
    status:              "completed",
  });
  return fmtMeetingHistory(session);
};