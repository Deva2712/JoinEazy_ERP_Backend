// docker cp seed-registrar-revaluation.js joineazy_erp_backend-backend-1:/app/seed-registrar-revaluation.js
// docker-compose exec backend node seed-registrar-revaluation.js

import sequelize          from "./src/database/connection.js";
import User               from "./src/modules/auth/auth-model.js";
import { RegistrarRequest, LorRequest } from "./src/modules/registrar/registrar-model.js";
import RevaluationRequest from "./src/modules/revaluation/revaluation-model.js";

async function seed() {
  try {
    await sequelize.authenticate();
    console.log(" DB connected\n");

    const prof    = await User.findOne({ where: { role: "professor" } });
    const student = await User.findOne({ where: { role: "student" } });

    if (!prof) { console.error(" No professor found — register one first"); process.exit(1); }

    const PROF_ID   = prof.id,    PROF_NAME   = prof.name;
    const STUD_ID   = student?.id || prof.id;
    const STUD_NAME = student?.name || "Demo Student";

    console.log(`Professor: ${PROF_NAME}`);
    console.log(`Student:   ${STUD_NAME}${!student ? " (fallback)" : ""}\n`);

    // ─── Registrar Requests ────────────────────────────────────────────────────
    await RegistrarRequest.bulkCreate([
      { student_id: STUD_ID, type: "transcript",  purpose: "Required for internship application at Infosys",              status: "pending",    copies: 2 },
      { student_id: STUD_ID, type: "bonafide",    purpose: "Needed for bank loan processing",                             status: "processing", copies: 1 },
      { student_id: STUD_ID, type: "migration",   purpose: "Required for higher education admission at Delhi University", status: "ready",      copies: 1, remarks: "Document ready for collection from registrar office." },
      { student_id: STUD_ID, type: "degree",      purpose: "For visa application to study abroad",                        status: "delivered",  copies: 1 },
      { student_id: STUD_ID, type: "other",       purpose: "Required for government job application",                     status: "rejected",   copies: 1, remarks: "Supporting documents were incomplete." },
    ]);
    console.log(" RegistrarRequests (5)");

    // ─── LOR Requests ─────────────────────────────────────────────────────────
    await LorRequest.bulkCreate([
      {
        student_id:   STUD_ID,
        professor_id: PROF_ID,
        purpose:      "Applying for M.Tech program in Computer Science at IIT Bombay",
        university:   "IIT Bombay",
        deadline:     new Date(Date.now() + 30 * 86400000),
        status:       "pending",
      },
      {
        student_id:   STUD_ID,
        professor_id: PROF_ID,
        purpose:      "PhD application in Machine Learning at NUS Singapore",
        university:   "NUS Singapore",
        deadline:     new Date(Date.now() + 45 * 86400000),
        status:       "accepted",
        remarks:      "Request approved. LoR will be submitted within 7 working days.",
        meeting_time: new Date(Date.now() + 3 * 86400000),
      },
      {
        student_id:   STUD_ID,
        professor_id: PROF_ID,
        purpose:      "MS application in Data Science at TU Berlin",
        university:   "TU Berlin",
        deadline:     new Date(Date.now() + 20 * 86400000),
        status:       "rejected",
        remarks:      "Insufficient academic interaction. Please approach your course professor.",
      },
      {
        student_id:   STUD_ID,
        professor_id: PROF_ID,
        purpose:      "Applying for research internship at ISRO",
        university:   null,
        deadline:     new Date(Date.now() + 15 * 86400000),
        status:       "completed",
        remarks:      "LoR has been submitted to the university portal.",
      },
    ]);
    console.log(" LorRequests (4)");

    // ─── Revaluation Requests ──────────────────────────────────────────────────
    await RevaluationRequest.bulkCreate([
      {
        student_id:    STUD_ID,
        professor_id:  PROF_ID,
        subject:       "Data Structures & Algorithms",
        exam_type:     "End Semester",
        reason:        "I believe my answer to Q3 was marked incorrectly. The logic I used is valid.",
        current_marks: 38,
        status:        "pending",
      },
      {
        student_id:    STUD_ID,
        professor_id:  PROF_ID,
        subject:       "Database Management Systems",
        exam_type:     "Mid Semester",
        reason:        "Partial marks were not given for Q2(b) despite correct steps shown.",
        current_marks: 22,
        status:        "under_review",
        remarks:       "Request accepted. Under re-evaluation by professor.",
      },
      {
        student_id:    STUD_ID,
        professor_id:  PROF_ID,
        subject:       "Operating Systems",
        exam_type:     "End Semester",
        reason:        "The diagram in Q5 was not evaluated. Requesting re-check.",
        current_marks: 41,
        revised_marks: 47,
        status:        "resolved",
        remarks:       "Marks revised from 41 to 47 after re-evaluation.",
      },
      {
        student_id:    STUD_ID,
        professor_id:  PROF_ID,
        subject:       "Computer Networks",
        exam_type:     "Internal Assessment",
        reason:        "My subjective answer in Q4 matches the model answer closely.",
        current_marks: 18,
        status:        "rejected",
        remarks:       "Answer evaluated correctly as per model answer. No change in marks.",
      },
      {
        student_id:    STUD_ID,
        professor_id:  PROF_ID,
        subject:       "Machine Learning",
        exam_type:     "End Semester",
        reason:        "I think there was an error in totalling the marks.",
        current_marks: 55,
        revised_marks: 61,
        status:        "accepted",
        remarks:       "Request accepted. Under re-evaluation by professor.",
      },
    ]);
    console.log(" RevaluationRequests (5)");

    console.log("\n Registrar & Revaluation seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error(" Seed failed:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

seed();