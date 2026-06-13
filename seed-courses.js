
import sequelize from "./src/database/connection.js";
import { Cohort, CohortParticipant } from "./src/modules/cohort/cohort-model.js";
import User from "./src/modules/auth/auth-model.js";
import { v4 as uuidv4 } from "uuid";
 
async function seed() {
  try {
    await sequelize.authenticate();
    console.log("DB connected");
 
    const prof = await User.findOne({ where: { role: "professor" } });
    if (!prof) { console.error("No professor found — register one first"); process.exit(1); }
 
    const PROF_ID = prof.id;
    const PROF_NAME = prof.name;
 
    // ─── Cohorts ───────────────────────────────────────────────────────────────
    const cohorts = await Cohort.bulkCreate([
      {
        id: uuidv4(),
        cohort_name: "Data Structures & Algorithms",
        cohort_description: "Core CS course covering arrays, trees, graphs, sorting and searching algorithms.",
        course_codes: "CS201",
        slug: "cs201-dsa-2025",
        instructor: PROF_NAME,
        creator_id: PROF_ID,
        creator_name: PROF_NAME,
        start_date: new Date("2025-08-01"),
        end_date: new Date("2025-12-15"),
        status: "Live",
        visibility: "Active",
        member_count: 0,
      },
      {
        id: uuidv4(),
        cohort_name: "Database Management Systems",
        cohort_description: "SQL, normalization, transactions, indexing and NoSQL databases.",
        course_codes: "CS301",
        slug: "cs301-dbms-2025",
        instructor: PROF_NAME,
        creator_id: PROF_ID,
        creator_name: PROF_NAME,
        start_date: new Date("2025-08-01"),
        end_date: new Date("2025-12-15"),
        status: "Live",
        visibility: "Active",
        member_count: 0,
      },
      {
        id: uuidv4(),
        cohort_name: "Operating Systems",
        cohort_description: "Process management, memory management, file systems and scheduling.",
        course_codes: "CS302",
        slug: "cs302-os-2025",
        instructor: PROF_NAME,
        creator_id: PROF_ID,
        creator_name: PROF_NAME,
        start_date: new Date("2025-08-01"),
        end_date: new Date("2025-12-15"),
        status: "Live",
        visibility: "Active",
        member_count: 0,
      },
      {
        id: uuidv4(),
        cohort_name: "Web Development Fundamentals",
        cohort_description: "HTML, CSS, JavaScript, React basics and REST APIs.",
        course_codes: "CS401",
        slug: "cs401-webdev-2025",
        instructor: PROF_NAME,
        creator_id: PROF_ID,
        creator_name: PROF_NAME,
        start_date: new Date("2025-01-01"),
        end_date: new Date("2025-05-30"),
        status: "Archived",
        visibility: "Archived",
        member_count: 0,
      },
    ]);
 
    console.log(` ${cohorts.length} cohorts seeded`);
 
    // ─── Add professor as participant in each Live cohort ─────────────────────
    const liveCohorts = cohorts.filter(c => c.status === "Live");
    for (const cohort of liveCohorts) {
      await CohortParticipant.create({
        cohort_id: cohort.id,
        user_id: PROF_ID,
        email: prof.email,
        display_name: PROF_NAME,
        is_active: true,
      });
    }
    console.log("Professor added as participant");
 
    console.log("\n Courses seeded! IDs:");
    cohorts.forEach(c => console.log(`  ${c.cohort_name}: ${c.id}`));
    process.exit(0);
  } catch (err) {
    console.error(" Seed failed:", err.message);
    process.exit(1);
  }
}
 
seed();