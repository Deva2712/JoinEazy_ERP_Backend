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

  const studentMap = new Map();
  logs.forEach((log) => {
    log.records.forEach((r) => {
      if (!studentMap.has(r.student_id)) {
        studentMap.set(r.student_id, {
          id:         r.student_id,
          name:       r.student_name,
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
      logs:     logsMap,
      isFinal,
    },
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
      createdAt: log.created_at,
    })),
  };
};

// ─── POST /courses/:courseId/attendance ───────────────────────────────────────
// Frontend sends: { studentIds: [...], date: "2026-06-06", status: "final" }
// FIX: allStudents fetch from previous attendance records for this cohort
//      so we dont need frontend to send allStudents
export const markAttendance = async (courseId, data, professor, cohortId) => {
  const { studentIds: presentIds = [], date, status = "final" } = data;

  // FIX: Fetch all known students for this cohort from past attendance records
  // This avoids needing frontend to send allStudents in body
  const existingRecords = await AttendanceRecord.findAll({
    include: [{
      model: AttendanceLog,
      as: "log",
      where: { cohort_id: cohortId },
      attributes: [],
    }],
    attributes: ["student_id", "student_name", "roll_number", "department"],
    group: ["student_id", "student_name", "roll_number", "department"],
  });

  // Also include any new presentIds that may not be in past records
  const knownStudentMap = new Map();
  existingRecords.forEach((r) => {
    knownStudentMap.set(r.student_id, {
      id:          r.student_id,
      name:        r.student_name,
      roll_number: r.roll_number,
      department:  r.department,
    });
  });

  // If no known students, use presentIds as the full list (first time marking)
  const allStudents = knownStudentMap.size > 0
    ? Array.from(knownStudentMap.values())
    : presentIds.map((id) => ({ id, name: "Unknown", roll_number: null, department: null }));

  // Upsert log — if today's log already exists, update it
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

  // Delete and recreate records — cleanest approach
  await AttendanceRecord.destroy({ where: { log_id: log.id } });

  const records = allStudents.map((student) => ({
    log_id:       log.id,
    student_id:   student.id,
    student_name: student.name,
    roll_number:  student.roll_number || null,
    department:   student.department || null,
    is_present:   presentIds.includes(student.id),
  }));

  if (records.length > 0) {
    await AttendanceRecord.bulkCreate(records);
  }

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