// src/modules/session-planning/session-planning-service.js
import { CourseSection, ScheduleSlot, SessionReflection, SectionDocument } from "./session-planning-model.js";

// ─── Helper: format section + schedule for frontend ──────────────────────────
const formatSection = (section) => {
  const json = section.toJSON ? section.toJSON() : section;
  return {
    id:          json.id,
    courseName:  json.course_name,
    courseCodes: json.course_codes || [],
    courseType:  json.course_type,
    startDate:   json.start_date,
    endDate:     json.end_date,
    status:      json.status,
    schedule:    (json.schedule || []).map((s) => ({
      day:          s.day,
      startTime:    s.start_time,
      endTime:      s.end_time,
      courseCode:   s.course_code,
      roomNumber:   s.room_number,
      buildingName: s.building_name,
      batchSection: s.batch_section,
      branch:       s.branch,
      semester:     s.semester,
    })),
  };
};

// ─── GET /sessions/schedules ──────────────────────────────────────────────────
export const getSchedules = async (professorId) => {
  const sections = await CourseSection.findAll({
    where: { professor_id: String(professorId) },
    include: [{ model: ScheduleSlot, as: "schedule" }],
    order: [["created_at", "ASC"]],
  });
  return sections.map(formatSection);
};

// ─── GET /sessions/today ──────────────────────────────────────────────────────
export const getTodaysClasses = async (professorId) => {
  const sections = await CourseSection.findAll({
    where: { professor_id: String(professorId), status: "Ongoing" },
    include: [{ model: ScheduleSlot, as: "schedule" }],
  });

  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const todayName = days[new Date().getDay()];

  const todays = [];
  sections.forEach((section) => {
    const formatted = formatSection(section);
    formatted.schedule
      .filter((s) => s.day === todayName)
      .forEach((slot, i) => {
        todays.push({
          ...slot,
          courseName: formatted.courseName,
          courseType: formatted.courseType,
          id: `${section.id}_today_${i}`,
        });
      });
  });

  return todays;
};

// ─── POST /sessions/:id/archive ───────────────────────────────────────────────
export const archiveSection = async (sectionId, professorId) => {
  const section = await CourseSection.findOne({ where: { id: sectionId, professor_id: String(professorId) } });
  if (!section) { const e = new Error("Section not found"); e.statusCode = 404; throw e; }
  await section.update({ status: "Completed" });
  return formatSection(section);
};

// ─── GET /sessions/reflections?sectionId= ────────────────────────────────────
export const getReflections = async (professorId, sectionId = null) => {
  const where = { professor_id: String(professorId) };
  if (sectionId) where.section_id = sectionId;

  const reflections = await SessionReflection.findAll({ where, order: [["date", "DESC"]] });
  return reflections.map((r) => ({
    id:            r.id,
    sectionId:     r.section_id,
    date:          r.date,
    topicsCovered: r.topics_covered,
    challenges:    r.challenges,
    nextSteps:     r.next_steps,
    status:        r.status,
  }));
};

// ─── POST /sessions/reflections ───────────────────────────────────────────────
export const saveReflection = async (professorId, data) => {
  const reflection = await SessionReflection.create({
    professor_id:   String(professorId),
    section_id:     data.sectionId || data.section_id,
    date:           data.date || new Date(),
    topics_covered: data.topicsCovered || data.topics_covered || null,
    challenges:     data.challenges || null,
    next_steps:     data.nextSteps || data.next_steps || null,
    status:         "Submitted",
  });

  return {
    id:            reflection.id,
    sectionId:     reflection.section_id,
    date:          reflection.date,
    topicsCovered: reflection.topics_covered,
    challenges:    reflection.challenges,
    nextSteps:     reflection.next_steps,
    status:        reflection.status,
  };
};

// ─── GET /sessions/documents/:courseId ────────────────────────────────────────
export const getDocuments = async (sectionId) => {
  const docs = await SectionDocument.findAll({ where: { section_id: sectionId } });
  const docsMap = {};
  docs.forEach((d) => {
    docsMap[d.doc_type] = { fileName: d.file_name, url: d.url, uploadedAt: d.updated_at };
  });
  return docsMap;
};

// ─── POST /sessions/documents/:courseId/bulk ─────────────────────────────────
export const uploadDocuments = async (sectionId, docs, fileNames = {}) => {
  await Promise.all(
    docs.map((docType) =>
      SectionDocument.upsert({
        section_id: sectionId,
        doc_type:   docType,
        file_name:  fileNames[docType] || `${docType}.pdf`,
        url:        `/uploads/${sectionId}/${docType}`,
      })
    )
  );
  return getDocuments(sectionId);
};

// ─── GET /student/sessions ────────────────────────────────────────────────────
export const getStudentSessions = async (studentId) => {
  const sections = await CourseSection.findAll({
    where: { status: "Ongoing" },
    include: [{ model: ScheduleSlot, as: "schedule" }],
  });
  return sections.map(formatSection);
};