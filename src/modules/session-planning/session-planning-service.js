import { Op } from "sequelize";
import { CourseSection, ScheduleSlot, SessionReflection, SectionDocument } from "./session-planning-model.js";
import { Cohort } from "../cohort/cohort-model.js";
import { uploadToS3 } from "../../middleware/upload.middleware.js";

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

// ─── GET /sessions/schedules — merge cohorts + course_sections ────────────────
export const getSchedules = async (professorId) => {
  // 1. Get real cohorts created by professor
  const cohorts = await Cohort.findAll({
    where: { creator_id: professorId, status: { [Op.ne]: "Archived" } },
    order: [["created_at", "ASC"]],
  });

  // 2. Get manually created course sections
  const sections = await CourseSection.findAll({
    where: { professor_id: String(professorId) },
    include: [{ model: ScheduleSlot, as: "schedule" }],
    order: [["created_at", "ASC"]],
  });

  // 3. Build set of cohort IDs already in course_sections
  const existingSectionIds = new Set(sections.map(s => s.id));

  // 4. Convert cohorts to section-like format (if not already in course_sections)
  const cohortSections = cohorts
    .filter(c => !existingSectionIds.has(c.id))
    .map(c => ({
      id: c.id,
      courseName: c.cohort_name,
      courseCodes: c.course_codes ? (Array.isArray(c.course_codes) ? c.course_codes : [c.course_codes]) : [],
      courseType: "Theory",
      startDate: c.start_date,
      endDate: c.end_date,
      status: c.status === "Live" ? "Ongoing" : c.status,
      schedule: [],
    }));

  // 5. Format existing sections
  const formattedSections = sections.map(formatSection);

  return [...cohortSections, ...formattedSections];
};

// ─── GET /sessions/today ──────────────────────────────────────────────────────
export const getTodaysClasses = async (professorId) => {
  const schedules = await getSchedules(professorId);
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const todayName = days[new Date().getDay()];

  const todays = [];
  schedules
    .filter(s => s.status === "Ongoing")
    .forEach((course) => {
      (course.schedule || [])
        .filter(s => s.day === todayName)
        .forEach((slot, i) => {
          todays.push({ ...slot, courseName: course.courseName, courseType: course.courseType, id: `${course.id}_today_${i}` });
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

// ─── GET /sessions/reflections ────────────────────────────────────────────────
export const getReflections = async (professorId, sectionId = null) => {
  const where = { professor_id: String(professorId) };
  if (sectionId) where.section_id = sectionId;
  const reflections = await SessionReflection.findAll({ where, order: [["date","DESC"]] });
  return reflections.map((r) => ({
    id:                   r.id,
    classId:              r.section_id,
    sectionId:            r.section_id,
    date:                 r.date,
    whatWasTaught:        r.topics_covered,
    needsImprovement:     r.challenges,
    topicsCarriedForward: r.next_steps,
    personalNotes:        null,
    visibleToHOD:         false,
    status:               r.status,
  }));
};

// ─── POST /sessions/reflections ───────────────────────────────────────────────
export const saveReflection = async (professorId, data) => {
  const reflection = await SessionReflection.create({
    professor_id:   String(professorId),
    section_id:     data.classId || data.sectionId || data.section_id,
    date:           data.date || new Date(),
    topics_covered: data.whatWasTaught || data.topicsCovered || null,
    challenges:     data.needsImprovement || data.challenges || null,
    next_steps:     data.topicsCarriedForward || data.nextSteps || null,
    status:         "Submitted",
  });
  return {
    id:                   reflection.id,
    classId:              reflection.section_id,
    sectionId:            reflection.section_id,
    date:                 reflection.date,
    whatWasTaught:        reflection.topics_covered,
    needsImprovement:     reflection.challenges,
    topicsCarriedForward: reflection.next_steps,
    personalNotes:        data.personalNotes || null,
    visibleToHOD:         data.visibleToHOD || false,
    status:               reflection.status,
  };
};

// ─── GET /sessions/documents/:courseId ────────────────────────────────────────
export const getDocuments = async (sectionId) => {
  const docs = await SectionDocument.findAll({ where: { section_id: sectionId } });
  const docsMap = {};
  docs.forEach((d) => { docsMap[d.doc_type] = { fileName: d.file_name, url: d.url, uploadedAt: d.updated_at }; });
  return docsMap;
};

// ─── POST /sessions/documents/:courseId/bulk ─────────────────────────────────
export const uploadDocuments = async (sectionId, filesByDocType) => {
  await Promise.all(
    Object.entries(filesByDocType).map(async ([docType, file]) => {
      const { url } = await uploadToS3(file, `session-planning/${sectionId}`);
      return SectionDocument.upsert({
        section_id: sectionId,
        doc_type:   docType,
        file_name:  file.originalname || `${docType}.pdf`,
        url,
      });
    })
  );
  return getDocuments(sectionId);
};

export const addScheduleSlot = async (sectionId, data) => {
  const slot = await ScheduleSlot.create({
    section_id:    sectionId,
    day:           data.day,
    start_time:    data.startTime,
    end_time:      data.endTime,
    course_code:   data.courseCode || null,
    room_number:   data.roomNumber || null,
    building_name: data.buildingName || null,
    batch_section: data.batchSection || null,
    branch:        data.branch || null,
    semester:      data.semester || null,
  });
  return slot.toJSON();
};

// ─── Student ──────────────────────────────────────────────────────────────────
export const getStudentSessions = async (studentId) => {
  const sections = await CourseSection.findAll({
    where: { status: "Ongoing" },
    include: [{ model: ScheduleSlot, as: "schedule" }],
  });
  return sections.map(formatSection);
};