import { Op } from "sequelize";
import { CourseSection, ScheduleSlot, SessionReflection, SectionDocument } from "./session-planning-model.js";
import { Cohort, CohortParticipant } from "../cohort/cohort-model.js";
import User from "../auth/auth-model.js";
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
  const cohorts = await Cohort.findAll({
    where: { creator_id: professorId, status: { [Op.ne]: "Archived" } },
    order: [["created_at", "ASC"]],
  });

  const sections = await CourseSection.findAll({
    where: { professor_id: String(professorId) },
    include: [{ model: ScheduleSlot, as: "schedule" }],
    order: [["created_at", "ASC"]],
  });

  const existingSectionIds = new Set(sections.map(s => s.id));

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

// ─── Student: GET /student/sessions ──────────────────────────────────────────
// Returns sessions shaped for StudentSessionCard:
// { id, courseCode, courseName, professor, credits, status, startDate, endDate,
//   schedule: [{ day, startTime, endTime, courseType, roomNumber, buildingName }] }
export const getStudentSessions = async (studentId) => {
  // 1. Student ke enrolled cohorts
  const participations = await CohortParticipant.findAll({
    where: { user_id: String(studentId) },
    attributes: ["cohort_id"],
  });
  if (!participations.length) return [];

  const cohortIds = participations.map((p) => p.cohort_id);

  // 2. Cohort details + professor IDs
  const cohorts = await Cohort.findAll({
    where: { id: { [Op.in]: cohortIds } },
    attributes: ["id", "cohort_name", "course_codes", "creator_id", "start_date", "end_date", "status"],
  });

  const profIds = [...new Set(cohorts.map((c) => c.creator_id).filter(Boolean))];
  const cohortByProfId = {};
  cohorts.forEach((c) => { if (c.creator_id) cohortByProfId[c.creator_id] = c; });

  // 3. Professor names
  const professors = profIds.length
    ? await User.findAll({ where: { id: { [Op.in]: profIds } }, attributes: ["id", "name"] })
    : [];
  const profNameMap = Object.fromEntries(professors.map((p) => [p.id, p.name]));

  // 4. CourseSection + ScheduleSlots for these professors
  const sections = profIds.length
    ? await CourseSection.findAll({
        where: { professor_id: { [Op.in]: profIds.map(String) } },
        include: [{ model: ScheduleSlot, as: "schedule" }],
      })
    : [];

  // 5. Build response from sections
  const sectionProfIds = new Set(sections.map((s) => s.professor_id));
  const results = sections.map((sec) => {
    const json = sec.toJSON ? sec.toJSON() : sec;
    const cohort = cohortByProfId[json.professor_id];
    return {
      id:         json.id,
      courseCode: json.course_codes?.[0] || cohort?.course_codes?.split(",")?.[0]?.trim() || json.id.slice(0, 6).toUpperCase(),
      courseName: json.course_name || cohort?.cohort_name || "Course",
      professor:  profNameMap[json.professor_id] || "Professor",
      credits:    json.credits || 3,
      status:     json.status || "Ongoing",
      startDate:  json.start_date || cohort?.start_date || null,
      endDate:    json.end_date   || cohort?.end_date   || null,
      schedule:   (json.schedule || []).map((s) => ({
        day:          s.day,
        startTime:    s.start_time,
        endTime:      s.end_time,
        courseType:   json.course_type || "Theory",
        roomNumber:   s.room_number   || "",
        buildingName: s.building_name || "",
      })),
    };
  });

  // 6. Fallback: cohorts with no CourseSection yet — still show them
  const fallbacks = cohorts
    .filter((c) => !sectionProfIds.has(String(c.creator_id)))
    .map((c) => ({
      id:         c.id,
      courseCode: c.course_codes?.split(",")?.[0]?.trim() || c.id.slice(0, 6).toUpperCase(),
      courseName: c.cohort_name,
      professor:  profNameMap[c.creator_id] || "Professor",
      credits:    3,
      status:     c.status === "Archived" ? "Completed" : "Ongoing",
      startDate:  c.start_date || null,
      endDate:    c.end_date   || null,
      schedule:   [],
    }));

  return [...results, ...fallbacks];
};