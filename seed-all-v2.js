
// docker-compose exec backend node seed-all-v2.js

import sequelize from "./src/database/connection.js";
import User from "./src/modules/auth/auth-model.js";
import { Cohort } from "./src/modules/cohort/cohort-model.js";
import { CohortAnnouncement } from "./src/modules/cohort-announcements/cohort-announcements-model.js";
import { CohortAssignment } from "./src/modules/cohort-assignments/cohort-assignments-model.js";
import { CohortPost } from "./src/modules/cohort-board/cohort-board-model.js";
import { CohortEvent } from "./src/modules/cohort-events/cohort-events-model.js";
import Leave from "./src/modules/leave/leave-model.js";
import { Notification } from "./src/modules/notifications/notifications-model.js";
import { JobTrayItem } from "./src/modules/job-tray/job-tray-model.js";
import { MentorSession } from "./src/modules/mentoring/mentoring-model.js";
import { RegistrarRequest, LorRequest } from "./src/modules/registrar/registrar-model.js";
import RevaluationRequest from "./src/modules/revaluation/revaluation-model.js";
import { Fee, Payment } from "./src/modules/finance/finance-model.js";
import Payroll from "./src/modules/payroll/payroll-model.js";
import { Asset, AssetRequest } from "./src/modules/asset-request/asset-request-model.js";
import { Expense } from "./src/modules/expenses/expenses-model.js";
import { Advance } from "./src/modules/advances/advances-model.js";
import ExamDuty from "./src/modules/exam-duties/exam-duties-model.js";
import MaintenanceRequest from "./src/modules/maintenance/maintenance-model.js";
import { LibraryBook, LibraryRequest } from "./src/modules/library/library-model.js";
import Bulletin from "./src/modules/bulletins/bulletins-model.js";
import { SessionSchedule, SessionReflection } from "./src/modules/session-planning/session-planning-model.js";

async function seed() {
  try {
    await sequelize.authenticate();
    console.log(" DB connected\n");

    const prof = await User.findOne({ where: { role: "professor" } });
    const student = await User.findOne({ where: { role: "student" } });
    if (!prof) { console.error(" No professor found — register one first"); process.exit(1); }

    const PROF_ID = prof.id, PROF_NAME = prof.name;
    const STUD_ID = student?.id || prof.id;
    const STUD_NAME = student?.name || "Demo Student";
    console.log(`Professor: ${PROF_NAME}`);
    console.log(`Student:   ${STUD_NAME}${!student ? " (fallback - no student registered!)" : ""}\n`);

    const cohorts = await Cohort.findAll({ where: { creator_id: PROF_ID }, limit: 4 });
    const COHORT_ID = cohorts[0]?.id || "1";
    console.log(`Cohorts found: ${cohorts.length}\n`);

    // ─── Announcements ─────────────────────────────────────────────────────────
    await CohortAnnouncement.bulkCreate([
      { cohort_id: COHORT_ID, author_id: PROF_ID, author_name: PROF_NAME, title: "Welcome!", content: "Welcome to the course. Check resources for syllabus.", type: "announcement", is_pinned: true },
      { cohort_id: COHORT_ID, author_id: PROF_ID, author_name: PROF_NAME, title: "Assignment Posted", content: "New assignment live, deadline next Friday.", type: "reminder", is_pinned: false },
    ]);
    console.log(" Announcements");

    // ─── Assignments ───────────────────────────────────────────────────────────
    await CohortAssignment.bulkCreate([
      { cohort_id: COHORT_ID, author_id: PROF_ID, title: "Assignment 1 - Sorting", description: "Implement bubble & merge sort.", type: "individual", deadline: new Date(Date.now() + 7*86400000), marks: 20 },
      { cohort_id: COHORT_ID, author_id: PROF_ID, title: "Group Project", description: "Build a mini compiler in groups of 4.", type: "group", deadline: new Date(Date.now() + 21*86400000), marks: 50 },
    ]);
    console.log(" Assignments");

    // ─── Cohort Board Posts ────────────────────────────────────────────────────
    await CohortPost.bulkCreate([
      { cohort_id: COHORT_ID, author_id: PROF_ID, author_name: PROF_NAME, title: "Class Notes Shared", content: "Uploaded today's notes in resources section.", type: "General", post_for: "Everyone" },
    ]);
    console.log(" Board posts");

    // ─── Cohort Events ─────────────────────────────────────────────────────────
    await CohortEvent.bulkCreate([
      { cohort_id: COHORT_ID, created_by: PROF_ID, created_by_name: PROF_NAME, title: "Guest Lecture", description: "Industry expert session.", location: "Seminar Hall", date: new Date(Date.now() + 5*86400000), start_time: "14:00", end_time: "16:00", status: "upcoming" },
    ]);
    console.log(" Events");

    // ─── Leaves ────────────────────────────────────────────────────────────────
    await Leave.bulkCreate([
      { applicant_id: PROF_ID, applicant_name: PROF_NAME, leave_type: "casual", from_date: new Date(Date.now()+7*86400000), to_date: new Date(Date.now()+9*86400000), reason: "Personal work", hod_status: "pending", hr_status: "pending", status: "pending" },
      { applicant_id: PROF_ID, applicant_name: PROF_NAME, leave_type: "medical", from_date: new Date(Date.now()-14*86400000), to_date: new Date(Date.now()-12*86400000), reason: "Medical checkup", hod_status: "approved", hr_status: "approved", status: "approved" },
    ]);
    console.log(" Leaves");

    // ─── Notifications ─────────────────────────────────────────────────────────
    await Notification.bulkCreate([
      { user_id: PROF_ID, title: "New Submission", message: "A student submitted Assignment 1.", type: "assignment", is_read: false },
      { user_id: PROF_ID, title: "Leave Approved", message: "Your medical leave was approved.", type: "leave", is_read: false },
      { user_id: PROF_ID, title: "Meeting Request", message: "Student requested a meeting tomorrow 3 PM.", type: "meeting", is_read: true },
      { user_id: STUD_ID, title: "Assignment Graded", message: "Your Assignment 1 has been graded.", type: "assignment", is_read: false },
    ]);
    console.log(" Notifications");

    // ─── Job Tray ──────────────────────────────────────────────────────────────
    await JobTrayItem.bulkCreate([
      { user_id: PROF_ID, type: "assignment", title: "Grade pending submissions", message: "3 students submitted Assignment 1 — pending review.", status: "pending", priority: "high", link: "/cohort/assignments" },
      { user_id: PROF_ID, type: "leave_update", title: "Review leave request", message: "A leave application is awaiting your approval.", status: "pending", priority: "normal", link: "/leave-application" },
      { user_id: STUD_ID, type: "fee_due", title: "Fee payment due", message: "Lab fee payment is due in 3 days.", status: "pending", priority: "high", link: "/finance" },
    ]);
    console.log(" Job tray");

    // ─── Mentoring ─────────────────────────────────────────────────────────────
    await MentorSession.bulkCreate([
      { mentor_id: PROF_ID, mentee_id: STUD_ID, title: "Career Guidance", scheduled_at: new Date(Date.now()+3*86400000), status: "pending", notes: "Discuss career options." },
      { mentor_id: PROF_ID, mentee_id: STUD_ID, title: "Research Opportunities", scheduled_at: new Date(Date.now()+7*86400000), status: "accepted", notes: "Explore research internships." },
    ]);
    console.log(" Mentoring");

    // ─── Registrar & LOR ───────────────────────────────────────────────────────
    await RegistrarRequest.bulkCreate([
      { student_id: STUD_ID, type: "bonafide", purpose: "Bank loan", copies: 2, status: "pending" },
      { student_id: STUD_ID, type: "transcript", purpose: "Grad school application", copies: 1, status: "ready" },
    ]);
    await LorRequest.bulkCreate([
      { student_id: STUD_ID, professor_id: PROF_ID, purpose: "MS application", university: "Stanford University", deadline: new Date(Date.now()+30*86400000), status: "pending" },
    ]);
    console.log(" Registrar & LOR");

    // ─── Revaluation ───────────────────────────────────────────────────────────
    await RevaluationRequest.bulkCreate([
      { student_id: STUD_ID, professor_id: PROF_ID, subject: "Data Structures", exam_type: "Mid-term", reason: "Marks not tallied correctly.", current_marks: 18, status: "pending" },
      { student_id: STUD_ID, professor_id: PROF_ID, subject: "Algorithms", exam_type: "End-term", reason: "Question 3 deserves full marks.", current_marks: 32, status: "under_review" },
    ]);
    console.log(" Revaluation");

    // ─── Finance ───────────────────────────────────────────────────────────────
    const fees = await Fee.bulkCreate([
      { student_id: STUD_ID, fee_head: "Tuition Fee", amount: 50000, due_date: new Date(Date.now()+15*86400000), status: "unpaid", paid_amount: 0 },
      { student_id: STUD_ID, fee_head: "Library Fee", amount: 2000, due_date: new Date(Date.now()+15*86400000), status: "paid", paid_amount: 2000 },
    ]);
    await Payment.bulkCreate([
      { student_id: STUD_ID, fee_id: fees[1].id, amount: 2000, mode: "Online", transaction_id: "TXN"+Date.now(), status: "success" },
    ]);
    console.log(" Finance");

    // ─── Payroll ───────────────────────────────────────────────────────────────
    const months = ["January","February","March","April","May","June"];
    await Payroll.bulkCreate(months.map((m,i)=>({
      user_id: PROF_ID, month: m, year: 2026, basic: 60000, hra: 15000, da: 6000, ta: 3000,
      other_allowances: 2000, pf_deduction: 7200, tax_deduction: 5000, other_deductions: 500,
      net_salary: 73300, status: i < 5 ? "paid" : "pending",
    })));
    console.log(" Payroll");

    // ─── Assets ────────────────────────────────────────────────────────────────
    const assets = await Asset.bulkCreate([
      { name: "Projector - Room 101", type: "Equipment", location: "Room 101", status: "available", description: "Epson projector" },
      { name: "Conference Room A", type: "Room", location: "Block A", capacity: 20, status: "available", description: "AC conference room" },
    ]);
    await AssetRequest.bulkCreate([
      { requester_id: PROF_ID, requester_name: PROF_NAME, asset_id: assets[0].id, asset_name: assets[0].name, type: "Equipment", date: new Date(Date.now()+2*86400000), start_time: "10:00", end_time: "12:00", reason: "Guest lecture", status: "Pending", posted_at: new Date() },
    ]);
    console.log(" Assets");

    // ─── Expenses & Advances ───────────────────────────────────────────────────
    await Expense.bulkCreate([
      { submitted_by: PROF_ID, submitted_name: PROF_NAME, title: "Lab Equipment Purchase", category: "Equipment", amount_spent: 4500, status: "Pending" },
      { submitted_by: PROF_ID, submitted_name: PROF_NAME, title: "Conference Travel", category: "Travel", amount_spent: 12000, status: "Approved" },
    ]);
    await Advance.bulkCreate([
      { submitted_by: PROF_ID, submitted_name: PROF_NAME, title: "Workshop Advance", category: "Event", amount_requested: 8000, status: "Pending" },
    ]);
    console.log(" Expenses & Advances");

    // ─── Exam Duties ───────────────────────────────────────────────────────────
    await ExamDuty.bulkCreate([
      { professor_id: PROF_ID, subject: "Data Structures", date: new Date(Date.now()+10*86400000), start_time: "09:00", end_time: "12:00", venue: "Hall A", status: "pending" },
      { professor_id: PROF_ID, subject: "Algorithms", date: new Date(Date.now()+12*86400000), start_time: "14:00", end_time: "17:00", venue: "Hall B", status: "accepted" },
    ]);
    console.log(" Exam duties");

    // ─── Maintenance ───────────────────────────────────────────────────────────
    await MaintenanceRequest.bulkCreate([
      { requester_id: PROF_ID, requester_name: PROF_NAME, category: "Electrical", location: "Room 204", title: "AC not working", description: "Classroom AC stopped cooling.", priority: "high", status: "pending" },
    ]);
    console.log(" Maintenance");

    // ─── Library ───────────────────────────────────────────────────────────────
    const books = await LibraryBook.bulkCreate([
      { title: "Introduction to Algorithms", author: "Cormen et al.", isbn: "978-0262046305", category: "Computer Science", total_copies: 5, available_copies: 3 },
      { title: "Clean Code", author: "Robert C. Martin", isbn: "978-0132350884", category: "Software Engineering", total_copies: 4, available_copies: 2 },
      { title: "Design Patterns", author: "Gang of Four", isbn: "978-0201633610", category: "Software Engineering", total_copies: 3, available_copies: 3 },
    ]);
    await LibraryRequest.create({
      user_id: STUD_ID, user_name: STUD_NAME, book_id: books[0].id, book_title: books[0].title,
      author: books[0].author, status: "approved", due_date: new Date(Date.now()+14*86400000),
    });
    console.log(" Library");

    // ─── Bulletins ─────────────────────────────────────────────────────────────
    await Bulletin.bulkCreate([
      { author_id: PROF_ID, author_name: PROF_NAME, title: "Holiday Notice", content: "Campus closed for national holiday next Monday.", level: "institution", priority: "Normal" },
      { author_id: PROF_ID, author_name: PROF_NAME, title: "Exam Schedule Released", content: "Mid-term exam schedule is now available.", level: "institution", priority: "High", is_pinned: true },
    ]);
    console.log(" Bulletins");

    // ─── Session Planning ──────────────────────────────────────────────────────
    const session = await SessionSchedule.create({
      professor_id: PROF_ID, cohort_id: COHORT_ID, title: "Sorting Algorithms",
      description: "Bubble, merge, quick sort comparisons.", scheduled_at: new Date(Date.now()-2*86400000),
      duration_mins: 90, status: "completed",
    });
    await SessionReflection.create({
      session_id: session.id, professor_id: PROF_ID,
      reflection: "Students understood sorting well, need more time on quicksort partitioning next class.",
    });
    await SessionSchedule.bulkCreate([
  {
    professor_id: PROF_ID,
    cohort_id: cohorts[0]?.id || null,
    course_name: "Data Structures & Algorithms",
    course_type: "Theory",
    course_codes: ["CS301"],
    start_date: "2026-01-10",
    end_date: "2026-06-30",
    status: "Ongoing",
    schedule: [
      { day: "Monday", startTime: "9:00 AM", endTime: "10:00 AM", courseCode: "CS301", roomNumber: "B204", buildingName: "Block B", batchSection: "CSE-A", branch: "CSE", semester: 3 },
      { day: "Wednesday", startTime: "10:00 AM", endTime: "11:00 AM", courseCode: "CS301", roomNumber: "A101", buildingName: "Block A", batchSection: "CSE-B", branch: "CSE", semester: 3 },
    ],
  },
]);
    console.log(" Session planning");

    console.log("\n All modules seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error(" Seed failed:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

seed();