// src/modules/cohort-attendance/cohort-attendance-service.js

import { Op } from "sequelize";
import { AttendanceLog, AttendanceRecord } from "./cohort-attendance-model.js";

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

  // Enrich with real user info
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
  const todayStr = new Date().toISOString().split("T")[0];

  logs.forEach((log) => {
    const presentIds = log.records.filter((r) => r.is_present).map((r) => r.student_id);
    const logDateStr = typeof log.date === "string"
      ? log.date.split("T")[0]
      : new Date(log.date).toISOString().split("T")[0];
    logsMap[logDateStr] = presentIds;
    if (logDateStr === todayStr && log.status === "final") isFinal = true; });

  return {
    status: "success",
    data: { students, logs: logsMap, isFinal },
  };
};

// ─── GET /professor/logs ──────────────────────────────────────────────────────
export const getProfessorLogs = async (professorId) => {
  const logs = await AttendanceLog.findAll({
    where: { professor_id: professorId },
    order: [["date", "DESC"]],
    limit: 30,
  });

  return {
    status: "success",
    data: logs.map((log) => ({
      id:        log.id,
      date:      log.date,
      courseId:  log.course_id,
      cohortId:  log.cohort_id,
      status:    log.status,
      checkIn:   log.status === "final" ? "Submitted" : "Draft",
      createdAt: log.created_at,
    })),
  };
};

// ─── POST /courses/:courseId/attendance ───────────────────────────────────────
export const markAttendance = async (courseId, data, professor, cohortId) => {
  const { studentIds: presentIds = [], date, status = "final" } = data;

  const { CohortParticipant } = await import("../cohort/cohort-model.js");
  const User = (await import("../auth/auth-model.js")).default;

  // Fetch all students for this cohort
  const participants = await CohortParticipant.findAll({ where: { cohort_id: cohortId } });
  const userIds = participants.map(p => p.user_id).filter(Boolean);
  const users = userIds.length
    ? await User.findAll({ where: { id: userIds }, attributes: ["id", "name"] })
    : [];
  const userMap = new Map(users.map(u => [u.id, u]));

  const allStudents = participants.map(p => ({
    id:          p.user_id || p.email,
    name:        userMap.get(p.user_id)?.name || p.display_name || p.email?.split("@")[0] || "Unknown",
    roll_number: p.roll_number || null,
    department:  null,
  }));

  // Upsert log
  const [log] = await AttendanceLog.upsert(
    {
      cohort_id:      cohortId,
      course_id:      courseId,
      professor_id:   professor.id,
      professor_name: professor.name,
      date,
      status,
    },
    { conflictFields: ["course_id", "date"] }
  );

  // Recreate records
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