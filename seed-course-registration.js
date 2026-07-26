// seed-course-registration.js
// Opens the registration window and adds a handful of demo courses
// (compulsory + elective) so the "Registration" tab has something to show.

import sequelize from "./src/database/connection.js";
import { AvailableCourse, RegistrationWindow } from "./src/modules/courses/courses-model.js";

const COMPULSORY = [
  { course_code: "CS301", title: "Data Structures & Algorithms", instructor: "Dr. Anjali Sharma",  credits: 4, overview: "Core data structures, algorithm design and complexity analysis.", is_compulsory: true },
  { course_code: "CS302", title: "Operating Systems",             instructor: "Prof. Sunil Mehta",  credits: 4, overview: "Processes, memory management, file systems, and concurrency.",   is_compulsory: true },
];

const ELECTIVES = [
  { course_code: "CS401", title: "Machine Learning",        instructor: "Dr. Priya Nair",    credits: 3, overview: "Supervised/unsupervised learning, model evaluation, and deployment.", is_elective: true },
  { course_code: "CS402", title: "Computer Networks",       instructor: "Prof. Ramesh Gupta", credits: 3, overview: "Network protocols, architecture, and security fundamentals.",         is_elective: true },
  { course_code: "CS403", title: "Cloud Computing",         instructor: "Dr. Kavita Desai",   credits: 3, overview: "Cloud architectures, virtualization, and distributed systems.",       is_elective: true },
  { course_code: "CS404", title: "Human-Computer Interaction", instructor: "Dr. Anjali Sharma", credits: 3, overview: "UX principles, usability testing, and interface design.",           is_elective: true },
];

async function run() {
  try {
    await sequelize.authenticate();
    console.log("DB connected\n");

    for (const course of [...COMPULSORY, ...ELECTIVES]) {
      const [row, created] = await AvailableCourse.findOrCreate({
        where: { course_code: course.course_code },
        defaults: course,
      });
      console.log(`${created ? "Created" : "Already exists"}: ${course.course_code} — ${course.title}`);
    }

    const windowEnd = new Date();
    windowEnd.setDate(windowEnd.getDate() + 14); // open for 2 weeks

    await RegistrationWindow.upsert({
      id: 1,
      is_open: true,
      window_end: windowEnd,
      next_window_date: null,
      max_electives: 3,
      target_semester: "Semester 5",
      target_academic_year: "2026-27",
    });
    console.log("\nRegistration window is now OPEN until", windowEnd.toDateString());

    console.log("\nDone.");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

run();