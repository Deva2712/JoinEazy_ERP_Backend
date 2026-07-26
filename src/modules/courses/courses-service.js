import { Op } from "sequelize";
import { AvailableCourse, RegistrationWindow, CourseRegistration, CourseFeedback, StudentRegProfile } from "./courses-model.js";

const fmtCourse = (c) => ({
  id:           c.id,
  courseCode:   c.course_code,
  title:        c.title,
  instructor:   c.instructor,
  credits:      c.credits,
  overview:     c.overview,
  isElective:   c.is_elective,
  isCompulsory: c.is_compulsory,
  department:   c.department,
  capacity:     c.capacity,
});

const fmtRegistration = (r, course) => ({
  id:           r.id,
  courseId:     r.course_id,
  title:        course?.title,
  courseCode:   course?.course_code,
  instructor:   course?.instructor,
  credits:      course?.credits,
  isElective:   r.is_elective,
  isCompulsory: r.is_compulsory,
  priority:     r.priority,
  status:       r.status,
  appliedAt:    r.createdAt,
  adminRemarks: r.admin_remarks,
});

const buildMyRegistrations = async (studentId) => {
  const regs = await CourseRegistration.findAll({ where: { student_id: studentId }, order: [["createdAt", "DESC"]] });
  const courseIds = [...new Set(regs.map((r) => r.course_id))];
  const courses = courseIds.length ? await AvailableCourse.findAll({ where: { id: courseIds } }) : [];
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));
  return regs.map((r) => fmtRegistration(r, courseMap[r.course_id]));
};

// ─── GET /student/courses/overview ─────────────────────────────────────────────
export const getOverview = async (studentId) => {
  const [config, regProfile] = await Promise.all([
    RegistrationWindow.findByPk(1),
    getRegistrationProfile(studentId),
  ]);

  // FIX (functional gap): AvailableCourse has semester/academic_year, and
  // RegistrationWindow has target_semester/target_academic_year specifically so the
  // open window can be scoped to one cohort — but courses were never actually filtered
  // by them. Every student (1st year, final year, any branch) was seeing the *entire*
  // catalog with zero differentiation. Scope it to the window's target when set; a
  // course with no semester/year tagged on it is treated as "always visible" (e.g.
  // a cross-semester elective), so only courses explicitly tagged for a *different*
  // semester/year than the target get excluded.
  const courseWhere = {};
  if (config?.target_semester) {
    courseWhere.semester = { [Op.or]: [config.target_semester, null] };
  }
  if (config?.target_academic_year) {
    courseWhere.academic_year = { [Op.or]: [config.target_academic_year, null] };
  }

  const [allCourses, myRegistrations] = await Promise.all([
    AvailableCourse.findAll({ where: courseWhere, order: [["title", "ASC"]] }),
    buildMyRegistrations(studentId),
  ]);

  // Department-restricted electives (course.department set) only show to students of
  // that department once they've entered their reg profile; before that (or for
  // department-agnostic/compulsory courses) everything in-scope still shows, matching
  // "1 chahe 2, jo bhi elective unke liye applicable hai wahi show ho".
  const studentDept = regProfile?.department || null;
  const courses = allCourses.filter((c) => {
    if (c.is_compulsory) return true;
    if (!c.department) return true; // open elective — visible to everyone in scope
    return studentDept ? c.department === studentDept : true; // profile not set yet → don't hide, just can't register electives until it is (enforced in register())
  });

  return {
    registrationConfig: config ? {
      isOpen:             config.is_open,
      windowEnd:          config.window_end,
      nextWindowDate:     config.next_window_date,
      maxElectives:       config.max_electives,
      targetSemester:     config.target_semester,
      targetAcademicYear: config.target_academic_year,
      resultsPublished:   config.results_published,
    } : { isOpen: false },
    registrationCourses: courses.map(fmtCourse),
    myRegistrations,
    registrationProfile: regProfile,
  };
};

// ─── GET/POST /student/courses/registration-profile ───────────────────────────
// One-time department/semester/CGPA entry. Locked after first save — the allocation
// algorithm needs a stable, non-gameable CGPA snapshot to rank students fairly.
export const getRegistrationProfile = async (studentId) => {
  const profile = await StudentRegProfile.findOne({ where: { student_id: studentId } });
  return profile ? {
    department: profile.department, semester: profile.semester,
    cgpa: Number(profile.cgpa), locked: profile.locked,
  } : null;
};

export const saveRegistrationProfile = async (studentId, data) => {
  const existing = await StudentRegProfile.findOne({ where: { student_id: studentId } });
  if (existing) {
    const e = new Error("Your department/semester/CGPA is already locked in and can't be changed.");
    e.statusCode = 409;
    throw e;
  }
  const { department, semester, cgpa } = data;
  if (!department || !semester || cgpa === undefined || cgpa === null) {
    const e = new Error("Department, semester and CGPA are all required.");
    e.statusCode = 400;
    throw e;
  }
  const cgpaNum = Number(cgpa);
  if (Number.isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
    const e = new Error("CGPA must be a number between 0 and 10.");
    e.statusCode = 400;
    throw e;
  }
  const profile = await StudentRegProfile.create({ student_id: studentId, department, semester, cgpa: cgpaNum, locked: true });
  return { department: profile.department, semester: profile.semester, cgpa: Number(profile.cgpa), locked: true };
};

// ─── POST /student/courses/register  body: { courses: [...] } ────────────────
export const register = async (studentId, courses = []) => {
  const hasElective = courses.some((c) => c.isElective);
  if (hasElective) {
    const profile = await StudentRegProfile.findOne({ where: { student_id: studentId } });
    if (!profile) {
      const e = new Error("Please submit your department, semester and CGPA before selecting electives.");
      e.statusCode = 400;
      throw e;
    }
  }
  for (const c of courses) {
    const exists = await CourseRegistration.findOne({ where: { student_id: studentId, course_id: c.id } });
    if (exists) continue;
    await CourseRegistration.create({
      student_id:    studentId,
      course_id:     c.id,
      is_elective:   !!c.isElective,
      is_compulsory: !!c.isCompulsory,
      priority:      c.isElective ? (c.priority ?? null) : null,
      // Compulsory courses need no approval. Electives stay "Pending" until the
      // registrar runs the CGPA-based allocation (runAllocation) on the final date —
      // they are NOT auto-approved here.
      status: c.isCompulsory ? "Approved" : "Pending",
    });
  }
  return buildMyRegistrations(studentId);
};

// ─── DELETE /student/courses/register/:regId ──────────────────────────────────
export const cancelRegistration = async (regId, studentId) => {
  const reg = await CourseRegistration.findOne({ where: { id: regId, student_id: studentId } });
  if (!reg) { const e = new Error("Registration not found"); e.statusCode = 404; throw e; }
  if (reg.status !== "Pending") { const e = new Error("Only pending registrations can be cancelled"); e.statusCode = 400; throw e; }
  await reg.destroy();
  return buildMyRegistrations(studentId);
};

// ─── PATCH /student/courses/register/:regId/swap  body: { newCourseId } ──────
export const swapCourse = async (regId, studentId, newCourseId) => {
  const reg = await CourseRegistration.findOne({ where: { id: regId, student_id: studentId } });
  if (!reg) { const e = new Error("Registration not found"); e.statusCode = 404; throw e; }
  if (!reg.is_elective) { const e = new Error("Only elective registrations can be swapped"); e.statusCode = 400; throw e; }
  await reg.update({ course_id: newCourseId, status: "Pending" });
  return buildMyRegistrations(studentId);
};

// ─── POST /student/courses/:cohortId/feedback  body: { ratings, comment } ────
export const submitFeedback = async (studentId, cohortId, data) => {
  const [feedback] = await CourseFeedback.findOrCreate({
    where: { student_id: studentId, cohort_id: cohortId },
    defaults: { ratings: data.ratings || {}, comment: data.comment || null },
  });
  await feedback.update({ ratings: data.ratings || feedback.ratings, comment: data.comment ?? feedback.comment });
  return { feedback: feedback.toJSON() };
};

// ─── Admin/Registrar: manage course catalog + registration window ───────────
export const listAllCourses = async () => {
  const courses = await AvailableCourse.findAll({ order: [["title", "ASC"]] });
  return courses.map(fmtCourse);
};

export const createCourse = async (data) => {
  const course = await AvailableCourse.create({
    course_code:   data.courseCode,
    title:         data.title,
    instructor:    data.instructor || null,
    credits:       data.credits || 3,
    overview:      data.overview || null,
    is_elective:   !!data.isElective,
    is_compulsory: !!data.isCompulsory,
    semester:      data.semester || null,
    academic_year: data.academicYear || null,
    capacity:      data.capacity ?? null,   // seats available for this elective (null = unlimited)
    department:    data.department || null, // restrict to one department (null = open to all)
  });
  return fmtCourse(course);
};

export const updateCourse = async (courseId, data) => {
  const course = await AvailableCourse.findByPk(courseId);
  if (!course) { const e = new Error("Course not found"); e.statusCode = 404; throw e; }
  await course.update({
    course_code:   data.courseCode   ?? course.course_code,
    title:         data.title        ?? course.title,
    instructor:    data.instructor   ?? course.instructor,
    credits:       data.credits      ?? course.credits,
    overview:      data.overview     ?? course.overview,
    is_elective:   data.isElective   ?? course.is_elective,
    is_compulsory: data.isCompulsory ?? course.is_compulsory,
    semester:      data.semester     ?? course.semester,
    academic_year: data.academicYear ?? course.academic_year,
    capacity:      data.capacity     ?? course.capacity,
    department:    data.department   ?? course.department,
  });
  return fmtCourse(course);
};

export const deleteCourse = async (courseId) => {
  const course = await AvailableCourse.findByPk(courseId);
  if (!course) { const e = new Error("Course not found"); e.statusCode = 404; throw e; }
  await course.destroy();
  return { deleted: true };
};

export const updateRegistrationWindow = async (data) => {
  const [config] = await RegistrationWindow.findOrCreate({ where: { id: 1 }, defaults: {} });
  await config.update({
    is_open:              data.isOpen              ?? config.is_open,
    window_end:           data.windowEnd            ?? config.window_end,
    next_window_date:     data.nextWindowDate        ?? config.next_window_date,
    max_electives:        data.maxElectives          ?? config.max_electives,
    target_semester:      data.targetSemester        ?? config.target_semester,
    target_academic_year: data.targetAcademicYear    ?? config.target_academic_year,
  });
  return {
    isOpen: config.is_open, windowEnd: config.window_end, nextWindowDate: config.next_window_date,
    maxElectives: config.max_electives, targetSemester: config.target_semester, targetAcademicYear: config.target_academic_year,
  };
};

// ─── POST /student/courses/admin/run-allocation ────────────────────────────────
// Runs once, on the final registration date. For every still-Pending elective
// registration:
//   • A course with no capacity set is unlimited — everyone pending on it is Approved.
//   • A course with capacity: every student who ranked it gets compared by CGPA.
//     - If the course has a `department`, only students with that department in their
//       StudentRegProfile are eligible at all (others are rejected outright for it).
//     - The highest-CGPA students up to `capacity` are held (tentatively Approved).
//     - Anyone bumped off (lowest CGPA once the seat count is exceeded) automatically
//       falls through to their NEXT ranked elective and tries again there — cascading
//       exactly like "Sub A full → next 30th CGPA student tries Sub B".
// This is the standard deferred-acceptance / stable-matching algorithm (same family
// used for engineering/medical seat counselling): every student ends up with the
// highest-ranked choice they were eligible AND competitive for, and no swap between
// two students' outcomes could make both of them better off.
export const runAllocation = async () => {
  const config = await RegistrationWindow.findByPk(1);
  if (!config) { const e = new Error("Registration window not configured."); e.statusCode = 400; throw e; }

  const pendingRegs = await CourseRegistration.findAll({ where: { is_elective: true, status: "Pending" } });
  if (!pendingRegs.length) {
    await config.update({ results_published: true });
    return { message: "No pending elective registrations — nothing to allocate.", allocated: 0, rejected: 0 };
  }

  const courseIds = [...new Set(pendingRegs.map((r) => r.course_id))];
  const courses   = await AvailableCourse.findAll({ where: { id: courseIds } });
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));

  const studentIds = [...new Set(pendingRegs.map((r) => r.student_id))];
  const profiles   = await StudentRegProfile.findAll({ where: { student_id: studentIds } });
  const profileMap = Object.fromEntries(profiles.map((p) => [p.student_id, p]));

  // Unlimited-capacity electives don't need ranking — approve every pending request.
  const unlimitedRegs = pendingRegs.filter((r) => !courseMap[r.course_id]?.capacity);
  for (const r of unlimitedRegs) await r.update({ status: "Approved" });

  // Everything else goes through CGPA-ranked, preference-cascading allocation.
  const limitedRegs = pendingRegs.filter((r) => !unlimitedRegs.includes(r));
  const prefsByStudent = {};
  for (const r of limitedRegs) (prefsByStudent[r.student_id] ??= []).push(r);
  Object.values(prefsByStudent).forEach((list) => list.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999)));

  const pointer = {};   // studentId -> index into their priority-sorted preference list
  const held    = {};   // courseId  -> [{ reg, cgpa, studentId }], kept sorted desc by CGPA
  Object.keys(prefsByStudent).forEach((sid) => { pointer[sid] = 0; });

  let freeQueue = Object.keys(prefsByStudent);
  while (freeQueue.length) {
    const studentId = freeQueue.shift();
    const prefs = prefsByStudent[studentId];
    const idx = pointer[studentId];
    if (idx >= prefs.length) continue; // exhausted every preference — ends up unmatched

    const reg     = prefs[idx];
    const course  = courseMap[reg.course_id];
    const profile = profileMap[studentId];

    const eligible = !!profile && (!course.department || course.department === profile.department);
    if (!eligible) {
      pointer[studentId] = idx + 1;
      freeQueue.push(studentId);
      continue;
    }

    const cgpa = Number(profile.cgpa);
    held[reg.course_id] = held[reg.course_id] || [];
    held[reg.course_id].push({ reg, cgpa, studentId });
    held[reg.course_id].sort((a, b) => b.cgpa - a.cgpa); // highest CGPA first

    if (held[reg.course_id].length > course.capacity) {
      const bumped = held[reg.course_id].pop(); // lowest CGPA in the held group gets bumped
      pointer[bumped.studentId] = pointer[bumped.studentId] + 1;
      freeQueue.push(bumped.studentId);
    }
  }

  let allocated = unlimitedRegs.length, rejected = 0;
  const heldRegIds = new Set();
  for (const list of Object.values(held)) {
    for (const { reg } of list) {
      await reg.update({ status: "Approved" });
      heldRegIds.add(reg.id);
      allocated++;
    }
  }
  for (const reg of limitedRegs) {
    if (!heldRegIds.has(reg.id)) {
      await reg.update({ status: "Rejected", admin_remarks: "No seats available in any of your preferences." });
      rejected++;
    }
  }

  await config.update({ results_published: true });
  return { message: "Allocation complete.", allocated, rejected };
};