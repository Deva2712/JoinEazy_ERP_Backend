
// IMPORTANT: Replace PROFESSOR_ID below with a real professor's UUID from your `users` table.
//   SELECT id, name, role FROM users WHERE role = 'professor';
//
import sequelize from "../../database/connection.js";
import { CourseSection, ScheduleSlot, SessionReflection, SectionDocument } from "./session-planning-model.js";

// CHANGE THIS to a real professor user id before running
const PROFESSOR_ID = "1f8172c4-e061-4937-9966-ab2471e31442";

const SECTIONS = [
  {
    id: "SEC001",
    professor_id: PROFESSOR_ID,
    course_name: "Data Structures & Algorithms",
    course_codes: ["CS201"],
    course_type: "Theory",
    start_date: "2026-01-15",
    end_date: "2026-05-15",
    status: "Ongoing",
    schedule: [
      { day: "Monday",    start_time: "9:00 AM",  end_time: "10:00 AM", course_code: "CS201", room_number: "204", building_name: "Block B", batch_section: "Sec A", branch: "CSE", semester: 4 },
      { day: "Wednesday", start_time: "9:00 AM",  end_time: "10:00 AM", course_code: "CS201", room_number: "204", building_name: "Block B", batch_section: "Sec A", branch: "CSE", semester: 4 },
      { day: "Friday",    start_time: "11:00 AM", end_time: "12:00 PM", course_code: "CS201", room_number: "204", building_name: "Block B", batch_section: "Sec A", branch: "CSE", semester: 4 },
    ],
  },
  {
    id: "SEC002",
    professor_id: PROFESSOR_ID,
    course_name: "Database Systems Lab",
    course_codes: ["CS301L"],
    course_type: "Lab",
    start_date: "2026-01-15",
    end_date: "2026-05-15",
    status: "Ongoing",
    schedule: [
      { day: "Tuesday",  start_time: "2:00 PM", end_time: "4:00 PM", course_code: "CS301L", room_number: "Lab 1", building_name: "Block C", batch_section: "Sec B", branch: "CSE", semester: 6 },
      { day: "Thursday", start_time: "2:00 PM", end_time: "4:00 PM", course_code: "CS301L", room_number: "Lab 1", building_name: "Block C", batch_section: "Sec B", branch: "CSE", semester: 6 },
    ],
  },
  {
    id: "SEC003",
    professor_id: PROFESSOR_ID,
    course_name: "Operating Systems",
    course_codes: ["CS305"],
    course_type: "Theory",
    start_date: "2025-08-01",
    end_date: "2025-12-15",
    status: "Completed",
    schedule: [
      { day: "Monday", start_time: "10:00 AM", end_time: "11:00 AM", course_code: "CS305", room_number: "101", building_name: "Block A", batch_section: "Sec A", branch: "CSE", semester: 5 },
    ],
  },
];

const REFLECTIONS = [
  {
    section_id: "SEC001",
    date: "2026-06-10",
    topics_covered: "Binary trees, traversal methods (in-order, pre-order, post-order)",
    challenges: "A few students struggled with recursive thinking for tree traversal.",
    next_steps: "Plan extra practice session with visual diagrams before moving to graphs.",
    status: "Submitted",
  },
  {
    section_id: "SEC002",
    date: "2026-06-11",
    topics_covered: "SQL joins — inner, left, right, full outer joins with practical queries",
    challenges: "Lab systems had connectivity issues for the first 20 minutes.",
    next_steps: "Continue with subqueries and aggregate functions next session.",
    status: "Submitted",
  },
];

const DOCUMENTS = [
  { section_id: "SEC001", doc_type: "courseOutline", file_name: "CS201_Course_Outline.pdf", url: "/uploads/SEC001/courseOutline" },
  { section_id: "SEC001", doc_type: "timeline",       file_name: "CS201_Timeline.xlsx",      url: "/uploads/SEC001/timeline" },
  { section_id: "SEC002", doc_type: "courseOutline",  file_name: "CS301L_Outline.pdf",        url: "/uploads/SEC002/courseOutline" },
];

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected. Seeding session-planning data...\n");

    for (const sec of SECTIONS) {
      const { schedule, ...sectionData } = sec;
      const [section, created] = await CourseSection.findOrCreate({
        where: { id: sec.id },
        defaults: sectionData,
      });
      console.log(created ? `Created section: ${sec.course_name}` : `⏭  Section exists: ${sec.course_name}`);

      if (created) {
        for (const slot of schedule) {
          await ScheduleSlot.create({ section_id: sec.id, ...slot });
        }
        console.log(`   ↳ Added ${schedule.length} schedule slot(s)`);
      }
    }

    console.log("");
    for (const ref of REFLECTIONS) {
      const existing = await SessionReflection.findOne({
        where: { section_id: ref.section_id, date: ref.date },
      });
      if (existing) {
        console.log(`⏭  Reflection exists for ${ref.section_id} on ${ref.date}`);
        continue;
      }
      await SessionReflection.create({ professor_id: PROFESSOR_ID, ...ref });
      console.log(`Created reflection for ${ref.section_id} (${ref.date})`);
    }

    console.log("");
    for (const doc of DOCUMENTS) {
      await SectionDocument.upsert(doc);
      console.log(`Document: ${doc.section_id} → ${doc.doc_type}`);
    }

    console.log("\n Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
};

run();