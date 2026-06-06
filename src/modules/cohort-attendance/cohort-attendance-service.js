// src/modules/cohort-attendance/cohort-attendance-service.js

import { Op } from "sequelize";
import { AttendanceLog, AttendanceRecord } from "./cohort-attendance-model.js";

// ─── GET /attendance/logs/:cohortId ──────────────────────────────────────────
export const getAttendanceLogs = async (cohortId) => {
  const logs = await AttendanceLog.findAll({
    where: { cohort_id: cohortId },
    include: [{ model: AttendanceRecord, as: "records" }],
    order: [["date", "DESC"]],
  });

  // Transform logs into { date: [presentStudentIds] } format for frontend
  const logsMap = {};
  let isFinal = false;

  const todayStr = new Date().toISOString().split("T")[0];

  logs.forEach((log) => {
    const presentIds = log.records
      .filter((r) => r.is_present)
      .map((r) => r.student_id);
    logsMap[log.date] = presentIds;

    if (log.date === todayStr && log.status === "final") {
      isFinal = true;
    }
  });

  // Get unique students from all records
  const studentMap = new Map();
  logs.forEach((log) => {
    log.records.forEach((r) => {
      if (!studentMap.has(r.student_id)) {
        studentMap.set(r.student_id, {
          id: r.student_id,
          name: r.student_name,
          rollNumber: r.roll_number,
          department: r.department,
        });
      }
    });
  });

  return {
    status: "success",
    data: {
      students: Array.from(studentMap.values()),
      logs: logsMap,
      isFinal,
    },
  };
};

// ─── GET /professor/logs ──────────────────────────────────────────────────────
// Professor's own attendance logs — check-in/check-out style
export const getProfessorLogs = async (professorId) => {
  const logs = await AttendanceLog.findAll({
    where: { professor_id: professorId },
    order: [["date", "DESC"]],
    limit: 30,
  });

  return {
    status: "success",
    data: logs.map((log) => ({
      id: log.id,
      date: log.date,
      courseId: log.course_id,
      cohortId: log.cohort_id,
      status: log.status,
      createdAt: log.created_at,
    })),
  };
};

// ─── POST /courses/:courseId/attendance ───────────────────────────────────────
// Payload: { studentIds: [uuid, ...], date: "2026-06-06", status: "final" }
// studentIds = present student IDs — absent = everyone else in cohort
export const markAttendance = async (courseId, data, professor, cohortId, allStudents = []) => {
  const { studentIds: presentIds = [], date, status = "final" } = data;

  // Upsert the log — agar aaj ka log already hai toh update karo
  const [log] = await AttendanceLog.upsert(
    {
      cohort_id: cohortId,
      course_id: courseId,
      professor_id: professor.id,
      professor_name: professor.name,
      date,
      status,
    },
    { conflictFields: ["course_id", "date"] }
  );

  // Delete old records for this log and recreate — cleanest approach
  await AttendanceRecord.destroy({ where: { log_id: log.id } });

  // Build records for all students
  const records = allStudents.map((student) => ({
    log_id: log.id,
    student_id: student.id,
    student_name: student.name,
    roll_number: student.rollNumber || student.roll_number || null,
    department: student.department || null,
    is_present: presentIds.includes(student.id),
  }));

  if (records.length > 0) {
    await AttendanceRecord.bulkCreate(records);
  }

  return {
    status: "success",
    data: {
      logId: log.id,
      date: log.date,
      courseId,
      presentCount: presentIds.length,
      totalCount: allStudents.length,
      status: log.status,
    },
  };
};