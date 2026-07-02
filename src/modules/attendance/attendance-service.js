import { StudentAttendance, StudentTask } from "./attendance-model.js";
import { Op } from "sequelize";
import { AttendanceLog, AttendanceRecord } from "../cohort-attendance/cohort-attendance-model.js";
import { Cohort, CohortParticipant } from "../cohort/cohort-model.js";
import { CohortCourse } from "../cohort-courses/cohort-courses-model.js";

// ─── GET /student/attendance ───────────────────────────────────────────────────

export const getStudentAttendance = async (studentId) => {
  const participations = await CohortParticipant.findAll({
    where: { user_id: studentId },
    attributes: ["cohort_id"],
  });
  const cohortIds = [...new Set(participations.map((p) => p.cohort_id))];
  if (!cohortIds.length) {
    return { courses: [], overallStats: { totalClasses: 0, totalPresent: 0, totalAbsent: 0, totalLeave: 0, overallPercentage: 0 } };
  }

  const [cohorts, logs] = await Promise.all([
    Cohort.findAll({ where: { id: { [Op.in]: cohortIds } }, attributes: ["id", "cohort_name"] }),
    AttendanceLog.findAll({
      where: { cohort_id: { [Op.in]: cohortIds } },
      include: [{ model: AttendanceRecord, as: "records", where: { student_id: studentId }, required: true }],
      order: [["date", "ASC"]],
    }),
  ]);
  const cohortNameMap = Object.fromEntries(cohorts.map((c) => [c.id, c.cohort_name]));

 const courseIds = [...new Set(logs.map((l) => l.course_id).filter((id) => id && !cohortIds.includes(id)))];
  const courseTitleMap = {};
  if (courseIds.length) {
    const courses = await CohortCourse.findAll({ where: { id: { [Op.in]: courseIds } }, attributes: ["id", "title"] });
    courses.forEach((c) => { courseTitleMap[c.id] = c.title; });
  }

  // Group logs by (cohort_id, course_id)
  const groups = new Map();
  for (const log of logs) {
    const key = `${log.cohort_id}::${log.course_id}`;
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        cohort_id: log.cohort_id,
        course_id: log.course_id,
        cohort_name: cohortNameMap[log.cohort_id] || "Unknown Cohort",
        professor_name: log.professor_name,
        total: 0,
        present: 0,
      });
    }
    const group = groups.get(key);
    group.total += 1;
    group.professor_name = log.professor_name; // most recent log's professor
    const myRecord = log.records[0];
    if (myRecord?.is_present) group.present += 1;
  }

  const courses = [...groups.values()].map((g) => {
    const absent = g.total - g.present;
    const percentage = g.total ? Math.round((g.present / g.total) * 100) : 0;
    const title = courseTitleMap[g.course_id];
    return {
      id: g.id,
      cohort_name: g.cohort_name,
      course_codes: title ? [title] : [],
      professor_name: g.professor_name,
      stats: { total: g.total, present: g.present, absent, leave: 0, percentage },
    };
  });

  const totalClasses = courses.reduce((sum, c) => sum + c.stats.total, 0);
  const totalPresent = courses.reduce((sum, c) => sum + c.stats.present, 0);
  const totalAbsent = courses.reduce((sum, c) => sum + c.stats.absent, 0);
  const overallPercentage = totalClasses ? Math.round((totalPresent / totalClasses) * 100) : 0;

  return {
    courses,
    overallStats: { totalClasses, totalPresent, totalAbsent, totalLeave: 0, overallPercentage },
  };
};

// ─── POST /student/attendance/qr ───────────────────────────────────────────────
export const markAttendanceViaQR = async (studentId, token) => {
  let payload;
  try {
    payload = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
  } catch {
    const err = new Error("Invalid or corrupted QR code.");
    err.statusCode = 400;
    throw err;
  }

  const { cid, ts, exp } = payload || {};
  if (!cid || !ts || !exp) {
    const err = new Error("QR code is missing required attendance details.");
    err.statusCode = 400;
    throw err;
  }

  if (Date.now() > ts + exp * 1000) {
    const err = new Error("This QR code has expired. Ask your professor to generate a new one.");
    err.statusCode = 410;
    throw err;
  }

  // Student must actually belong to this cohort
  const isMember = await CohortParticipant.findOne({ where: { cohort_id: cid, user_id: studentId } });
  if (!isMember) {
    const err = new Error("You are not enrolled in this cohort.");
    err.statusCode = 403;
    throw err;
  }

  const dateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  let log = await AttendanceLog.findOne({ where: { course_id: cid, date: dateStr } });
  if (!log) {
    const cohort = await Cohort.findByPk(cid, { attributes: ["id", "creator_id", "creator_name"] });
    if (!cohort) {
      const err = new Error("Attendance session could not be resolved.");
      err.statusCode = 404;
      throw err;
    }
    log = await AttendanceLog.create({
      cohort_id: cid,
      course_id: cid,
      professor_id: cohort.creator_id,
      professor_name: cohort.creator_name,
      date: dateStr,
      status: "draft",
    });
  }

  let record = await AttendanceRecord.findOne({ where: { log_id: log.id, student_id: studentId } });
  if (record) {
    if (record.is_present) {
      const err = new Error("Attendance already marked for this session.");
      err.statusCode = 409;
      throw err;
    }
    await record.update({ is_present: true });
  } else {
    record = await AttendanceRecord.create({
      log_id: log.id,
      student_id: studentId,
      student_name: isMember.display_name || isMember.email?.split("@")[0] || "Student",
      roll_number: isMember.roll_number || null,
      is_present: true,
    });
  }

  return { message: "Attendance marked successfully", logId: log.id, date: log.date };
};

export const getTimetable = async (studentId) => {
  return { timetable: [] };
};
export const getTasks = async (studentId, date) => {
  const where = { student_id: studentId };
  if (date) where.due_date = date;
  const tasks = await StudentTask.findAll({ where });
  return { tasks };
};
export const createTask = async (studentId, data) => {
  const task = await StudentTask.create({ student_id: studentId, ...data });
  return { task };
};
export const toggleTask = async (taskId, studentId) => {
  const task = await StudentTask.findOne({ where: { id: taskId, student_id: studentId } });
  if (!task) { const err = new Error("Task not found"); err.statusCode = 404; throw err; }
  await task.update({ is_completed: !task.is_completed });
  return { task };
};
export const deleteTask = async (taskId, studentId) => {
  const task = await StudentTask.findOne({ where: { id: taskId, student_id: studentId } });
  if (!task) { const err = new Error("Task not found"); err.statusCode = 404; throw err; }
  await task.destroy();
  return { message: "Task deleted" };
};
export const getSessions = async (studentId) => {
  return { sessions: [] };
};