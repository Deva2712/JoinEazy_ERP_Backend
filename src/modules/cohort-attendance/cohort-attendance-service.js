// src/modules/cohort-attendance/cohort-attendance-service.js

import { Op } from "sequelize";
import { AttendanceLog, AttendanceRecord } from "./cohort-attendance-model.js";


const getAllowedAttendanceDates = () => {
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const dates = [todayStr];
  let checked = 1;
  while (dates.length < 3 && checked < 10) {
    const d = new Date(todayStr + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() - checked);
    if (d.getUTCDay() !== 0) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${day}`);
    }
    checked++;
  }
  return dates;
};

const validateAttendanceDate = (date) => {
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const targetStr = typeof date === "string" ? date.split("T")[0] : date.toISOString().split("T")[0];

  if (targetStr > todayStr) {
    const err = new Error("Cannot mark attendance for a future date.");
    err.statusCode = 400;
    throw err;
  }

  const allowed = getAllowedAttendanceDates();
  if (!allowed.includes(targetStr)) {
    const err = new Error("Backdate limit exceeded. Only today or previous 2 working days (excluding Sunday) allowed.");
    err.statusCode = 400;
    throw err;
  }
};

export const getAttendanceLogs = async (cohortId) => {
  const { CohortParticipant } = await import("../cohort/cohort-model.js");
  const User = (await import("../auth/auth-model.js")).default;

  const [logs, participants] = await Promise.all([
    AttendanceLog.findAll({
      where: { cohort_id: cohortId },
      include: [{ model: AttendanceRecord, as: "records" }],
      order: [["date", "DESC"]],
    }),
    CohortParticipant.findAll({ where: { cohort_id: cohortId } }),
  ]);

  const userIds = participants.map(p => p.user_id).filter(Boolean);
  const users = userIds.length
    ? await User.findAll({ where: { id: userIds }, attributes: ["id", "name", "email"] })
    : [];
  const userMap = new Map(users.map(u => [u.id, u]));

  const students = participants.map(p => {
    const u = userMap.get(p.user_id);
    return {
      id:         p.user_id || p.email,
      name:       u?.name || p.display_name || p.username || p.email?.split("@")[0] || "Unknown",
      rollNumber: p.roll_number || p.email?.split("@")[0] || "",
      email:      u?.email || p.email || "",
      department: "",
    };
  });

  const logsMap = {};
  let isFinal = false;
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  logs.forEach((log) => {
    const presentIds = log.records.filter((r) => r.is_present).map((r) => r.student_id);
    const logDateStr = typeof log.date === "string"
      ? log.date.split("T")[0]
      : new Date(log.date).toISOString().split("T")[0];
    logsMap[logDateStr] = presentIds;
    if (logDateStr === todayStr && log.status === "final") isFinal = true;
  });

  return {
    status: "success",
    data: { students, logs: logsMap, isFinal },
  };
};

// ─── GET /professor/logs ──────────────────────────────────────────────────────
export const getProfessorLogs = async (professorId) => {
  const { Cohort } = await import("../cohort/cohort-model.js");

  const logs = await AttendanceLog.findAll({
    where: { professor_id: professorId },
    order: [["date", "DESC"]],
    limit: 60,
  });

  const cohortIds = [...new Set(logs.map(l => l.cohort_id).filter(Boolean))];
  const cohorts = cohortIds.length
    ? await Cohort.findAll({ where: { id: cohortIds }, attributes: ["id", "cohort_name"] })
    : [];
  const cohortMap = new Map(cohorts.map(c => [c.id, c.cohort_name]));

  return {
    status: "success",
    data: logs.map((log) => ({
      id:          log.id,
      date:        log.date,
      courseId:    log.course_id,
      cohortId:    log.cohort_id,
      courseName:  cohortMap.get(log.cohort_id) || log.course_id || "Unknown Course",
      status:      log.status,
      checkIn:     log.status === "final" ? "Submitted" : "Draft",
      isSubmitted: log.status === "final",
      createdAt:   log.created_at,
    })),
  };
};

// ─── POST /courses/:courseId/attendance ───────────────────────────────────────
export const markAttendance = async (courseId, data, professor, cohortId) => {
  const { studentIds: presentIds = [], date, status = "final" } = data;

  //  Date validation
  validateAttendanceDate(date);

  const { CohortParticipant } = await import("../cohort/cohort-model.js");
  const User = (await import("../auth/auth-model.js")).default;

  const participants = await CohortParticipant.findAll({ where: { cohort_id: cohortId } });
  const userIds = participants.map(p => p.user_id).filter(Boolean);
  const users = userIds.length
    ? await User.findAll({ where: { id: userIds }, attributes: ["id", "name"] })
    : [];
  const userMap = new Map(users.map(u => [u.id, u]));

  // Sirf un participants ko include karo jinka actual account link hai
  // (user_id maujood hai). Jo sirf email se invite hue hain aur abhi register
  // nahi hue (user_id null), unki id unki email ban jaati thi — aur
  // student_id column strictly UUID hai, isliye email insert karne pe
  // PostgreSQL crash karta tha ("invalid input syntax for type uuid").
  const allStudents = participants
    .filter(p => p.user_id)
    .map(p => ({
      id:          p.user_id,
      name:        userMap.get(p.user_id)?.name || p.display_name || p.email?.split("@")[0] || "Unknown",
      roll_number: p.roll_number || null,
      department:  null,
    }));

  // ✅ upsert ki jagah findOne + create/update — PostgreSQL mein reliable
  const dateStr = typeof date === "string" ? date.split("T")[0] : date;
  let log = await AttendanceLog.findOne({
    where: { course_id: courseId, date: dateStr },
  });

  if (log) {
    await log.update({ status, professor_id: professor.id, professor_name: professor.name });
  } else {
    log = await AttendanceLog.create({
      cohort_id:      cohortId,
      course_id:      courseId,
      professor_id:   professor.id,
      professor_name: professor.name,
      date:           dateStr,
      status,
    });
  }

  // Records recreate karo
  await AttendanceRecord.destroy({ where: { log_id: log.id } });

  const records = allStudents.map((student) => ({
    log_id:       log.id,
    student_id:   student.id,
    student_name: student.name,
    roll_number:  student.roll_number || null,
    department:   student.department || null,
    is_present:   presentIds.includes(student.id),
  }));

  if (records.length > 0) await AttendanceRecord.bulkCreate(records);

  return {
    status: "success",
    data: {
      logId:        log.id,
      date:         log.date,
      courseId,
      presentCount: presentIds.length,
      totalCount:   allStudents.length,
      status:       log.status,
    },
  };
};