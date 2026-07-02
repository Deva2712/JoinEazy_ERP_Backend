// docker cp fix-existing-revaluation-data.js joineazy_erp_backend-backend-1:/app/fix-existing-revaluation-data.js
// docker-compose exec backend node fix-existing-revaluation-data.js
//
// One-off backfill: the original seed script created RevaluationRequest rows
// before subject_code / semester / max_marks / original_grade / revised_grade
// / priority existed as columns. This fills those in for the existing rows
// (matched by subject name) so the "My Requests" cards render correctly.

import sequelize from "./src/database/connection.js";
import RevaluationRequest from "./src/modules/revaluation/revaluation-model.js";

const gradeFromPercentage = (pct) => {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return null;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
};

const FIXES = {
  "Data Structures & Algorithms": { subject_code: "CS301", semester: "Semester 5", max_marks: 100 },
  "Database Management Systems":  { subject_code: "CS304", semester: "Semester 5", max_marks: 100 },
  "Operating Systems":            { subject_code: "CS302", semester: "Semester 5", max_marks: 100 },
  "Computer Networks":            { subject_code: "CS305", semester: "Semester 5", max_marks: 100 },
  "Machine Learning":             { subject_code: "CS401", semester: "Semester 6", max_marks: 100 },
};

async function run() {
  try {
    await sequelize.authenticate();
    console.log("DB connected\n");

    const requests = await RevaluationRequest.findAll();
    let updated = 0;

    for (const req of requests) {
      const fix = FIXES[req.subject];
      if (!fix) continue;

      const originalGrade = gradeFromPercentage((req.current_marks / fix.max_marks) * 100);
      const revisedGrade = req.revised_marks != null
        ? gradeFromPercentage((req.revised_marks / fix.max_marks) * 100)
        : null;

      await req.update({
        subject_code: fix.subject_code,
        semester: fix.semester,
        max_marks: fix.max_marks,
        original_grade: originalGrade,
        revised_grade: revisedGrade,
        priority: req.priority || "Mid",
      });
      updated++;
      console.log(`Updated: ${req.subject} (${fix.subject_code})`);
    }

    console.log(`\nDone. ${updated} request(s) backfilled.`);
    process.exit(0);
  } catch (err) {
    console.error("Fix failed:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

run();