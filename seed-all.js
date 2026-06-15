
// docker-compose exec backend node seed-all.js

import sequelize from "./src/database/connection.js";
import User from "./src/modules/auth/auth-model.js";
import { CohortAnnouncement } from "./src/modules/cohort-announcements/cohort-announcements-model.js";
import { CohortAssignment } from "./src/modules/cohort-assignments/cohort-assignments-model.js";
import Leave from "./src/modules/leave/leave-model.js";
import {Notification} from "./src/modules/notifications/notifications-model.js";
import { MentorSession } from "./src/modules/mentoring/mentoring-model.js";
import { RegistrarRequest, LorRequest } from "./src/modules/registrar/registrar-model.js";
import RevaluationRequest from "./src/modules/revaluation/revaluation-model.js";
import { Fee, Payment } from "./src/modules/finance/finance-model.js";
import Payroll from "./src/modules/payroll/payroll-model.js";
import { Asset, AssetRequest } from "./src/modules/asset-request/asset-request-model.js";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  try {
    await sequelize.authenticate();
    console.log(" DB connected\n");

    // ─── Get users ─────────────────────────────────────────────────────────────
    const prof = await User.findOne({ where: { role: "professor" } });
    const student = await User.findOne({ where: { role: "student" } });

    if (!prof) { console.error("No professor found — register one first"); process.exit(1); }

    const PROF_ID   = prof.id;
    const PROF_NAME = prof.name;
    const STUD_ID   = student?.id || PROF_ID;
    const STUD_NAME = student?.name || PROF_NAME;
    const COHORT_ID = "1";

    console.log(`Professor: ${PROF_NAME} (${PROF_ID})`);
    console.log(`Student:   ${STUD_NAME} (${STUD_ID})\n`);

    // ─── Announcements ─────────────────────────────────────────────────────────
    await CohortAnnouncement.bulkCreate([
      { cohort_id: COHORT_ID, author_id: PROF_ID, author_name: PROF_NAME, title: "Welcome to CS101!", content: "Welcome everyone! Please check the resources section for the syllabus.", type: "announcement", is_pinned: true },
      { cohort_id: COHORT_ID, author_id: PROF_ID, author_name: PROF_NAME, title: "Assignment 1 Posted", content: "Assignment 1 is live. Submission deadline is next Friday.", type: "reminder", is_pinned: false },
      { cohort_id: COHORT_ID, author_id: PROF_ID, author_name: PROF_NAME, title: "Mid-term Schedule", content: "Mid-term exams will be held in Week 8. Detailed schedule will follow.", type: "update", is_pinned: false },
      { cohort_id: COHORT_ID, author_id: PROF_ID, author_name: PROF_NAME, title: "Lab Session Rescheduled", content: "Thursday lab session is moved to Friday 3 PM due to maintenance.", type: "update", is_pinned: false },
    ]);
    console.log(" Announcements seeded");

    // ─── Assignments ───────────────────────────────────────────────────────────
    await CohortAssignment.bulkCreate([
      { cohort_id: COHORT_ID, author_id: PROF_ID, title: "Assignment 1 - Bubble Sort", description: "Implement bubble sort and merge sort. Submit a zip file with code + report.", type: "individual", deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), marks: 20 },
      { cohort_id: COHORT_ID, author_id: PROF_ID, title: "Assignment 2 - Linked List", description: "Implement a linked list with insert, delete, and search operations.", type: "individual", deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), marks: 30 },
      { cohort_id: COHORT_ID, author_id: PROF_ID, title: "Group Project - Mini Compiler", description: "Build a basic lexer and parser for a simple language. Groups of 3-4.", type: "group", deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), marks: 50 },
    ]);
    console.log(" Assignments seeded");

    // ─── Leaves ────────────────────────────────────────────────────────────────
    await Leave.bulkCreate([
      { applicant_id: PROF_ID, applicant_name: PROF_NAME, leave_type: "casual", from_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), to_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), reason: "Personal work", hod_status: "pending", hr_status: "pending", status: "pending" },
      { applicant_id: PROF_ID, applicant_name: PROF_NAME, leave_type: "medical", from_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), to_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), reason: "Medical checkup", hod_status: "approved", hr_status: "approved", status: "approved" },
      { applicant_id: PROF_ID, applicant_name: PROF_NAME, leave_type: "earned", from_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), to_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), reason: "Family vacation", hod_status: "pending", hr_status: "pending", status: "pending" },
    ]);
    console.log("Leaves seeded");

    // ─── Notifications ─────────────────────────────────────────────────────────
    await Notification.bulkCreate([
      { user_id: PROF_ID, title: "New Assignment Submission", message: "A student has submitted Assignment 1.", type: "assignment", is_read: false },
      { user_id: PROF_ID, title: "Leave Approved", message: "Your medical leave has been approved by HOD.", type: "leave", is_read: false },
      { user_id: PROF_ID, title: "Meeting Request", message: "Student John Doe has requested a meeting tomorrow at 3 PM.", type: "meeting", is_read: true },
      { user_id: PROF_ID, title: "New Announcement", message: "Department seminar scheduled for next Monday.", type: "general", is_read: true },
    ]);
    console.log("Notifications seeded");

    // ─── Mentoring ─────────────────────────────────────────────────────────────
    await MentorSession.bulkCreate([
      { mentor_id: PROF_ID, mentee_id: STUD_ID, title: "Career Guidance Session", scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), status: "pending", notes: "Discuss career options after graduation." },
      { mentor_id: PROF_ID, mentee_id: STUD_ID, title: "Research Opportunities", scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), status: "accepted", notes: "Explore research internship options." },
      { mentor_id: PROF_ID, mentee_id: STUD_ID, title: "Academic Performance Review", scheduled_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: "completed", notes: "Reviewed mid-term performance." },
    ]);
    console.log(" Mentoring sessions seeded");

    // ─── Registrar Requests ────────────────────────────────────────────────────
    await RegistrarRequest.bulkCreate([
      { student_id: STUD_ID, type: "bonafide", purpose: "Bank loan application", copies: 2, status: "pending" },
      { student_id: STUD_ID, type: "transcript", purpose: "University application abroad", copies: 1, status: "ready" },
    ]);
    await LorRequest.bulkCreate([
      { student_id: STUD_ID, professor_id: PROF_ID, purpose: "MS application to Stanford", university: "Stanford University", deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), status: "pending" },
    ]);
    console.log(" Registrar & LOR seeded");

    // ─── Revaluation ───────────────────────────────────────────────────────────
    await RevaluationRequest.bulkCreate([
      { student_id: STUD_ID, professor_id: PROF_ID, subject: "Data Structures", exam_type: "Mid-term", reason: "Marks not tallied correctly", current_marks: 18, status: "pending" },
      { student_id: STUD_ID, professor_id: PROF_ID, subject: "Algorithms", exam_type: "End-term", reason: "Question 3 answer was correct", current_marks: 32, status: "under_review" },
    ]);
    console.log(" Revaluation requests seeded");

    // ─── Finance ───────────────────────────────────────────────────────────────
    const fees = await Fee.bulkCreate([
      { student_id: STUD_ID, fee_head: "Tuition Fee", amount: 50000, due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), status: "unpaid", paid_amount: 0 },
      { student_id: STUD_ID, fee_head: "Library Fee", amount: 2000, due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), status: "paid", paid_amount: 2000 },
      { student_id: STUD_ID, fee_head: "Lab Fee", amount: 5000, due_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), status: "unpaid", paid_amount: 0 },
    ]);
    await Payment.bulkCreate([
      { student_id: STUD_ID, fee_id: fees[1].id, amount: 2000, mode: "Online", transaction_id: "TXN" + Date.now(), status: "success" },
    ]);
    console.log(" Finance seeded");

    // ─── Payroll ───────────────────────────────────────────────────────────────
    const months = ["January","February","March","April","May","June"];
    await Payroll.bulkCreate(months.map((month, i) => ({
      user_id: PROF_ID,
      month,
      year: 2026,
      basic: 60000,
      hra: 15000,
      da: 6000,
      ta: 3000,
      other_allowances: 2000,
      pf_deduction: 7200,
      tax_deduction: 5000,
      other_deductions: 500,
      net_salary: 73300,
      status: i < 5 ? "paid" : "pending",
    })));
    console.log(" Payroll seeded");

    // ─── Assets ────────────────────────────────────────────────────────────────
    const assets = await Asset.bulkCreate([
      { name: "Projector - Room 101", type: "Equipment", location: "Room 101", capacity: null, status: "available", description: "Epson projector for presentations" },
      { name: "Conference Room A", type: "Room", location: "Block A, Floor 2", capacity: 20, status: "available", description: "AC conference room with whiteboard" },
      { name: "Lab Computer Set (10 units)", type: "Equipment", location: "Computer Lab 3", capacity: 10, status: "available", description: "Core i5 computers with programming software" },
      { name: "Seminar Hall", type: "Room", location: "Main Building", capacity: 100, status: "available", description: "Large hall for seminars and guest lectures" },
    ]);
    await AssetRequest.bulkCreate([
      { requester_id: PROF_ID, requester_name: PROF_NAME, asset_id: assets[0].id, asset_name: assets[0].name, type: "Equipment", date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), start_time: "10:00", end_time: "12:00", reason: "Guest lecture presentation", status: "Pending", posted_at: new Date() },
      { requester_id: PROF_ID, requester_name: PROF_NAME, asset_id: assets[1].id, asset_name: assets[1].name, type: "Room", date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), start_time: "14:00", end_time: "16:00", reason: "Team meeting", status: "Approved", posted_at: new Date() },
    ]);
    console.log(" Assets seeded");

    console.log("\n All modules seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
}

seed();