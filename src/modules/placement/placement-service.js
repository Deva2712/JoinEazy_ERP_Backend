import { StudentProfile } from "../student-profile/student-profile-model.js";
import User from "../auth/auth-model.js";
import {
  PlacementCompany,
  PlacementJob,
  PlacementApplication,
  PlacementOffer,
  PlacementStudent,
  AssessmentTest,
  AssessmentScore,
  PlacementTrainingSession,
  PlacementTrainingAttendance,
  PlacementTrainingTest,
  PlacementTrainingScore,
  PlacementTrainingCourse,
  PlacementCourseEnrollment,
} from "./placement-model.js";

const jobStatusToStorage = {
  open: "Applications open",
  closed: "Closed",
  "Applications open": "Applications open",
  Assessment: "Assessment",
  Interviews: "Interviews",
  Offered: "Offered",
  "Drive complete": "Drive complete",
  Closed: "Closed",
  Cancelled: "Cancelled",
};

const jobStatusToApi = {
  "Applications open": "open",
  Closed: "closed",
};

const applicationStatusToStorage = {
  Interview: "Interview Scheduled",
};

const applicationStatusToApi = {
  "Interview Scheduled": "Interview",
};

const courseStatusToStorage = {
  upcoming: "Planned",
  active: "Running",
  completed: "Completed",
};

const courseStatusToApi = {
  Planned: "upcoming",
  Running: "active",
  Completed: "completed",
  Cancelled: "cancelled",
};

const enrollmentStatusToApi = {
  Enrolled: "Enrolled",
  Completed: "Completed",
  Dropped: "Dropped",
};

const modeToStorage = {
  online: "Online",
  offline: "Offline",
  hybrid: "Online",
  Online: "Online",
  Offline: "Offline",
};

const modeToApi = {
  Online: "online",
  Offline: "offline",
};

const notAuthorizedForStudent = () => {
  const err = new Error("Not authorized for this student");
  err.statusCode = 403;
  throw err;
};

const storageJobStatus = (status) => jobStatusToStorage[status] || status;
const apiJobStatus = (status) => jobStatusToApi[status] || status;
const storageApplicationStatus = (status) => applicationStatusToStorage[status] || status;
const apiApplicationStatus = (status) => applicationStatusToApi[status] || status;
const storageCourseStatus = (status) => courseStatusToStorage[status] || status;
const apiCourseStatus = (status) => courseStatusToApi[status] || status;
const apiEnrollmentStatus = (status) => enrollmentStatusToApi[status] || status;
const storageMode = (mode) => modeToStorage[mode] || mode;
const apiMode = (mode) => modeToApi[mode] || mode;

const resolveStudentAccess = async (requestedId, userId) => {
  if (!requestedId || requestedId === userId) return userId;
  const student = await PlacementStudent.findOne({ where: { rollNo: requestedId }, attributes: ["userId"] });
  if (student?.userId === userId) return userId;
  notAuthorizedForStudent();
};

const assertSameStudent = async (requestedId, userId) => {
  await resolveStudentAccess(requestedId, userId);
};

const assertOwner = (row, userId, label = "Resource") => {
  if (!row || row.instructorId !== userId) {
    const err = new Error(`${label} not found or not authorized`);
    err.statusCode = row ? 403 : 404;
    throw err;
  }
};

const getStudentProfile = async (userId) => {
  const [profile] = await StudentProfile.findOrCreate({
    where: { user_id: userId },
    defaults: { user_id: userId },
  });
  return profile;
};

const getPlacementStudent = async (userId) => {
  return PlacementStudent.findOne({ where: { userId } });
};

const defaultPlacementPortfolio = (portfolio = {}) => ({
  skills: Array.isArray(portfolio.skills) ? portfolio.skills : [],
  certifications: Array.isArray(portfolio.certifications) ? portfolio.certifications : [],
  projects: Array.isArray(portfolio.projects) ? portfolio.projects : [],
  linkedinUrl: portfolio.linkedinUrl || "",
  githubUrl: portfolio.githubUrl || "",
});

const normalizeDocuments = (documents) => {
  if (!documents) return {};
  if (!Array.isArray(documents) && typeof documents === "object") return documents;
  if (Array.isArray(documents)) {
    return documents.reduce((acc, doc) => {
      if (doc?.resumeUrl) acc.resumeUrl = doc.resumeUrl;
      if (doc?.portfolioUrl) acc.portfolioUrl = doc.portfolioUrl;
      return acc;
    }, {});
  }
  return {};
};

const publicUrlForFile = (file) => file?.location || file?.path || null;

const shapeJob = (job) => {
  const j = job?.toJSON ? job.toJSON() : job;
  return { ...j, status: apiJobStatus(j.status) };
};

const shapeOffer = (offer) => {
  const o = offer?.toJSON ? offer.toJSON() : offer;
  return {
    id: o.id,
    applicationId: o.applicationId,
    studentId: o.studentId,
    studentName: o.studentName,
    companyId: o.companyId,
    companyName: o.companyName,
    role: o.role,
    ctc: o.ctc,
    joiningDate: o.joiningDate,
    location: o.location,
    sector: o.sector,
    ppo: o.ppo,
    offCampus: o.offCampus,
    letterUrl: o.letterUrl,
    status: o.status,
    createdAt: o.createdAt,
  };
};

const shapeAssessmentResult = (score) => {
  const s = score?.toJSON ? score.toJSON() : score;
  const test = s.test || s.AssessmentTest || {};
  return {
    id: s.id,
    jobId: test.job_id || null,
    studentId: s.student_id,
    rollNo: s.student?.rollNo || null,
    result: s.result,
    notes: s.notes,
    uploadedAt: s.attempted_at || s.updatedAt || s.createdAt,
  };
};

const shapeSession = async (session) => {
  const s = session?.toJSON ? session.toJSON() : session;
  const enrolledCount = s.courseId
    ? await PlacementCourseEnrollment.count({ where: { courseId: s.courseId } })
    : 0;
  return {
    id: s.id,
    courseId: s.courseId,
    type: s.type,
    category: s.category,
    title: s.title,
    date: s.date,
    endDate: s.endDate,
    instructor: s.instructor,
    instructorId: s.instructorId,
    capacity: s.capacity,
    mode: apiMode(s.mode),
    status: s.status,
    venue: s.venue,
    link: s.link,
    eligibleBranches: s.eligibleBranches,
    minCgpa: s.minCgpa,
    prerequisites: s.prerequisites,
    enrolledCount,
  };
};

const shapeTest = (test) => {
  const t = test?.toJSON ? test.toJSON() : test;
  return {
    id: t.id,
    courseId: t.courseId,
    category: t.category,
    title: t.title,
    description: t.description,
    testNumber: t.testNumber,
    testLink: t.testLink,
    date: t.date,
    maxScore: t.maxScore,
  };
};

const shapeCompany = (company) => {
  const c = company?.toJSON ? company.toJSON() : company;
  return {
    id: c.id,
    schools: c.schools || [],
    name: c.name,
    sector: c.sector,
    profile: c.profile,
    status: c.status,
    recruiterContacts: [],
    hiringHistory: [],
    engagementScore: c.engagementScore,
  };
};

const shapeApplication = (application) => {
  const a = application?.toJSON ? application.toJSON() : application;
  const job = a.job || a.PlacementJob || null;
  return {
    id: a.id,
    jobId: a.jobId,
    studentId: a.studentId,
    studentName: a.studentName,
    studentRoll: a.studentRoll,
    status: apiApplicationStatus(a.status),
    currentRound: a.currentRound,
    resumeUrl: a.resumeUrl,
    appliedAt: a.appliedAt,
    notes: a.notes,
    statusHistory: [],
    interviewDate: null,
    job: job ? {
      id: job.id,
      companyId: job.companyId,
      companyName: job.companyName,
      role: job.role,
      type: job.type,
      location: job.location,
      package: job.package,
      stipend: job.stipend,
      deadline: job.deadline,
      status: apiJobStatus(job.status),
    } : null,
  };
};

const shapeCourse = async (course, studentId) => {
  const c = course?.toJSON ? course.toJSON() : course;
  const [enrolled, enrolledCount] = await Promise.all([
    studentId
      ? PlacementCourseEnrollment.findOne({ where: { courseId: c.id, studentId } })
      : null,
    PlacementCourseEnrollment.count({ where: { courseId: c.id } }),
  ]);
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    eligibleBranches: c.eligibleBranches,
    eligibleYears: c.eligibleYears,
    minCgpa: c.minCgpa,
    capacity: c.capacity,
    startDate: c.startDate,
    endDate: c.endDate,
    instructorIds: c.instructorIds,
    guestInstructors: c.guestInstructors,
    defaultInstructor: c.defaultInstructor,
    status: apiCourseStatus(c.status),
    enrollmentStatus: enrolled ? apiEnrollmentStatus(enrolled.status) : null,
    enrolled: Boolean(enrolled),
    enrolledCount,
  };
};

const shapeProfessorProgramCourse = (course) => {
  const c = course?.toJSON ? course.toJSON() : course;
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    eligibleBranches: c.eligibleBranches,
    eligibleYears: c.eligibleYears,
    minCgpa: c.minCgpa,
    capacity: c.capacity,
    startDate: c.startDate,
    endDate: c.endDate,
    status: apiCourseStatus(c.status),
  };
};

const shapeProfessorProgramStudent = (enrollment, user, placementStudent) => ({
  studentId: enrollment.studentId,
  name: user?.name || placementStudent?.name || null,
  rollNo: placementStudent?.rollNo || placementStudent?.email || null,
  branch: placementStudent?.branch || null,
});

const normalizeTrainingCourseData = (data) => ({
  ...data,
  ...(data.status !== undefined && { status: storageCourseStatus(data.status) }),
});

const normalizeTrainingSessionData = (data) => ({
  ...data,
  ...(data.mode !== undefined && { mode: storageMode(data.mode) }),
});

const normalizeApplicationData = (data) => ({
  ...data,
  ...(data.status !== undefined && { status: storageApplicationStatus(data.status) }),
});

export const getOverview = async (studentId) => {
  const [jobs, applications, profile] = await Promise.all([
    PlacementJob.findAll({ where: { status: "Applications open", archived: false }, order: [["postedAt", "DESC"]] }),
    PlacementApplication.findAll({
      where: { studentId },
      include: [{ model: PlacementJob, as: "job", required: false }],
      order: [["appliedAt", "DESC"]],
    }),
    getStudentProfile(studentId),
  ]);
  const portfolio = profile.portfolio || {};
  const documents = normalizeDocuments(portfolio.documents);
  return {
    jobs: jobs.map(shapeJob),
    applications: applications.map(shapeApplication),
    resumeUrl: documents.resumeUrl || null,
    projectUrl: portfolio.projects?.[0]?.link || null,
  };
};

export const getOffers = async (studentId) => {
  const offers = await PlacementOffer.findAll({ where: { studentId }, order: [["createdAt", "DESC"]] });
  return offers.map(shapeOffer);
};

export const applyToJob = async (studentId, user, jobId) => {
  const existing = await PlacementApplication.findOne({ where: { studentId, jobId } });
  if (existing) {
    const err = new Error("Application already exists");
    err.statusCode = 409;
    throw err;
  }

  const [profile, placementStudent] = await Promise.all([
    StudentProfile.findOne({ where: { user_id: studentId } }),
    getPlacementStudent(studentId),
  ]);
  const documents = normalizeDocuments(profile?.portfolio?.documents);
  return PlacementApplication.create(normalizeApplicationData({
    studentId,
    jobId,
    studentName: placementStudent?.name || user.name || null,
    studentRoll: placementStudent?.rollNo || profile?.official_email || null,
    resumeUrl: documents.resumeUrl || null,
    status: "Applied",
  }));
};

export const updateResume = async (studentId, file) => {
  const profile = await getStudentProfile(studentId);
  const portfolio = profile.portfolio || {};
  const documents = normalizeDocuments(portfolio.documents);
  const nextPortfolio = {
    ...portfolio,
    documents: { ...documents, resumeUrl: publicUrlForFile(file) },
  };
  await profile.update({ portfolio: nextPortfolio });
  return { resumeUrl: nextPortfolio.documents.resumeUrl };
};

export const updatePortfolioDocument = async (studentId, file) => {
  const profile = await getStudentProfile(studentId);
  const portfolio = profile.portfolio || {};
  const documents = normalizeDocuments(portfolio.documents);
  const nextPortfolio = {
    ...portfolio,
    documents: { ...documents, portfolioUrl: publicUrlForFile(file) },
  };
  await profile.update({ portfolio: nextPortfolio });
  return { portfolioUrl: nextPortfolio.documents.portfolioUrl };
};

export const getPlacementProfile = async (studentId) => {
  const profile = await getStudentProfile(studentId);
  return defaultPlacementPortfolio(profile.portfolio || {});
};

export const updatePlacementProfile = async (studentId, data) => {
  const profile = await getStudentProfile(studentId);
  const current = profile.portfolio || {};
  const allowed = ["skills", "certifications", "projects", "linkedinUrl", "githubUrl"];
  const updates = allowed.reduce((acc, key) => {
    if (data[key] !== undefined) acc[key] = data[key];
    return acc;
  }, {});
  const nextPortfolio = { ...current, ...defaultPlacementPortfolio(current), ...updates };
  await profile.update({ portfolio: nextPortfolio });
  return defaultPlacementPortfolio(nextPortfolio);
};

export const updateOfferStatus = async (studentId, offerId, status) => {
  const nextStatus = status === "Deferred" ? "Pending" : status;
  const offer = await PlacementOffer.findOne({ where: { id: offerId, studentId } });
  if (!offer) {
    const err = new Error("Offer not found");
    err.statusCode = 404;
    throw err;
  }
  await offer.update({ status: nextStatus });
  return shapeOffer(offer);
};

export const getAssessmentResults = async (studentId, jobId) => {
  const rows = await AssessmentScore.findAll({
    where: { student_id: studentId },
    include: [
      { model: AssessmentTest, as: "test", required: true, where: { job_id: jobId } },
      { model: PlacementStudent, as: "student", required: false },
    ],
    order: [["attempted_at", "DESC"], ["updatedAt", "DESC"]],
  });
  return rows.map(shapeAssessmentResult);
};

export const getTrainingSessions = async () => {
  const sessions = await PlacementTrainingSession.findAll({ order: [["date", "ASC"]] });
  return Promise.all(sessions.map(shapeSession));
};

export const getTrainingSession = async (sessionId) => {
  const session = await PlacementTrainingSession.findByPk(sessionId);
  if (!session) {
    const err = new Error("Training session not found");
    err.statusCode = 404;
    throw err;
  }
  return shapeSession(session);
};

export const getSessionAttendance = async (sessionId) => {
  return PlacementTrainingAttendance.findAll({ where: { sessionId }, order: [["createdAt", "ASC"]] });
};

export const getStudentAttendance = async (requestedStudentId, userId) => {
  const studentId = await resolveStudentAccess(requestedStudentId, userId);
  return PlacementTrainingAttendance.findAll({ where: { studentId }, order: [["createdAt", "DESC"]] });
};

export const getTrainingAttendanceForUser = async (requestedStudentId, user) => {
  if (user.role !== "professor") {
    const studentId = await resolveStudentAccess(requestedStudentId || user.id, user.id);
    return PlacementTrainingAttendance.findAll({ where: { studentId }, order: [["createdAt", "DESC"]] });
  }
  const where = requestedStudentId ? { studentId: requestedStudentId } : {};
  return PlacementTrainingAttendance.findAll({ where, order: [["createdAt", "DESC"]] });
};

export const upsertAttendance = async (user, data) => {
  const studentId = user.role === "professor" ? data.studentId : data.studentId || user.id;
  const resolvedStudentId = user.role === "professor" ? studentId : await resolveStudentAccess(studentId, user.id);
  const placementStudent = await getPlacementStudent(resolvedStudentId);
  const [row] = await PlacementTrainingAttendance.findOrCreate({
    where: { sessionId: data.sessionId, studentId: resolvedStudentId },
    defaults: {
      sessionId: data.sessionId,
      studentId: resolvedStudentId,
      studentRollNo: placementStudent?.rollNo || data.studentRollNo || null,
      present: data.present ?? false,
      registered: data.registered ?? false,
      notes: data.notes || null,
      markedBy: user.id,
    },
  });
  await row.update({
    studentRollNo: placementStudent?.rollNo || data.studentRollNo || row.studentRollNo,
    present: data.present ?? row.present,
    registered: data.registered ?? row.registered,
    notes: data.notes ?? row.notes,
    markedBy: user.id,
  });
  return row;
};

export const upsertBulkAttendance = async (user, entries = []) => {
  return Promise.all(entries.map((entry) => upsertAttendance(user, entry)));
};

export const getTrainingScores = async (requestedStudentId, user) => {
  if (user.role !== "professor") {
    const studentId = await resolveStudentAccess(requestedStudentId || user.id, user.id);
    return PlacementTrainingScore.findAll({ where: { studentId }, order: [["recordedAt", "DESC"]] });
  }
  const where = requestedStudentId ? { studentId: requestedStudentId } : {};
  return PlacementTrainingScore.findAll({ where, order: [["recordedAt", "DESC"]] });
};

export const getTrainingTests = async () => {
  const tests = await PlacementTrainingTest.findAll({ order: [["date", "ASC"], ["testNumber", "ASC"]] });
  return tests.map(shapeTest);
};

export const getTrainingCourses = async (requestedStudentId, user) => {
  const studentId = requestedStudentId && user.role !== "professor"
    ? await resolveStudentAccess(requestedStudentId, user.id)
    : requestedStudentId || user.id;
  const courses = await PlacementTrainingCourse.findAll({ order: [["startDate", "ASC"]] });
  return Promise.all(courses.map((course) => shapeCourse(course, studentId)));
};

export const enrollInCourse = async (userId, data) => {
  await assertSameStudent(data.studentId, userId);
  const existing = await PlacementCourseEnrollment.findOne({
    where: { courseId: data.courseId, studentId: userId },
  });
  if (existing) {
    const err = new Error("Enrollment already exists");
    err.statusCode = 409;
    throw err;
  }
  return PlacementCourseEnrollment.create({ courseId: data.courseId, studentId: userId, status: "Enrolled" });
};

export const createTrainingCourse = async (user, data) => {
  const instructorIds = Array.isArray(data.instructorIds) ? data.instructorIds : [];
  const nextInstructorIds = instructorIds.includes(user.id) ? instructorIds : [...instructorIds, user.id];
  return shapeCourse(await PlacementTrainingCourse.create({
    ...normalizeTrainingCourseData(data),
    instructorIds: nextInstructorIds,
  }), null);
};

export const updateTrainingCourse = async (user, courseId, data) => {
  const course = await PlacementTrainingCourse.findByPk(courseId);
  const instructorIds = Array.isArray(course?.instructorIds) ? course.instructorIds : [];
  if (!course || !instructorIds.includes(user.id)) {
    const err = new Error(course ? "Not authorized for this training course" : "Training course not found");
    err.statusCode = course ? 403 : 404;
    throw err;
  }
  await course.update(normalizeTrainingCourseData(data));
  return shapeCourse(course, null);
};

export const deleteTrainingCourse = async (user, courseId) => {
  const course = await PlacementTrainingCourse.findByPk(courseId);
  const instructorIds = Array.isArray(course?.instructorIds) ? course.instructorIds : [];
  if (!course || !instructorIds.includes(user.id)) {
    const err = new Error(course ? "Not authorized for this training course" : "Training course not found");
    err.statusCode = course ? 403 : 404;
    throw err;
  }
  await course.destroy();
  return { success: true, message: "Training course deleted" };
};

export const createTrainingSession = async (user, data) => {
  const session = await PlacementTrainingSession.create({
    ...normalizeTrainingSessionData(data),
    instructorId: user.id,
    instructor: user.name || data.instructor || null,
  });
  return shapeSession(session);
};

export const updateTrainingSession = async (user, sessionId, data) => {
  const session = await PlacementTrainingSession.findByPk(sessionId);
  assertOwner(session, user.id, "Training session");
  await session.update({ ...normalizeTrainingSessionData(data), instructorId: user.id });
  return shapeSession(session);
};

export const deleteTrainingSession = async (user, sessionId) => {
  const session = await PlacementTrainingSession.findByPk(sessionId);
  assertOwner(session, user.id, "Training session");
  await session.destroy();
  return { success: true, message: "Training session deleted" };
};

export const createTrainingTest = async (user, data) => {
  const test = await PlacementTrainingTest.create({ ...data, instructorId: user.id });
  return shapeTest(test);
};

export const updateTrainingTest = async (user, testId, data) => {
  const test = await PlacementTrainingTest.findByPk(testId);
  assertOwner(test, user.id, "Training test");
  await test.update({ ...data, instructorId: user.id });
  return shapeTest(test);
};

export const deleteTrainingTest = async (user, testId) => {
  const test = await PlacementTrainingTest.findByPk(testId);
  assertOwner(test, user.id, "Training test");
  await test.destroy();
  return { success: true, message: "Training test deleted" };
};

export const createTrainingScore = async (data) => {
  const placementStudent = data.studentId ? await getPlacementStudent(data.studentId) : null;
  return PlacementTrainingScore.create({
    ...data,
    studentRollNo: placementStudent?.rollNo || data.studentRollNo || null,
  });
};

export const updateTrainingScore = async (scoreId, data) => {
  const score = await PlacementTrainingScore.findByPk(scoreId);
  if (!score) {
    const err = new Error("Training score not found");
    err.statusCode = 404;
    throw err;
  }
  await score.update({ score: data.score ?? score.score, notes: data.notes ?? score.notes });
  return score;
};

export const getProfessorOverview = async (branch) => {
  const where = branch ? { studentBranch: branch } : {};
  const offers = await PlacementOffer.findAll({ where, order: [["createdAt", "DESC"]] });
  const shaped = offers.map(shapeOffer);
  const pastPlacedStudents = shaped.filter((offer) => offer.status === "Accepted");
  return {
    pastPlacedStudents,
    batchTotals: {
      totalOffers: shaped.length,
      accepted: shaped.filter((offer) => offer.status === "Accepted").length,
      pending: shaped.filter((offer) => offer.status === "Pending").length,
      rejected: shaped.filter((offer) => offer.status === "Rejected").length,
      deferred: 0,
    },
    branch: branch || null,
  };
};

export const getCurrentStudents = async () => {
  const [users, placementStudents, acceptedOffers] = await Promise.all([
    User.findAll({ where: { role: "student" }, attributes: ["id", "name"], order: [["name", "ASC"]] }),
    PlacementStudent.findAll({
      attributes: ["userId", "rollNo", "branch", "batchYear", "cgpa", "backlogs"],
    }),
    PlacementOffer.findAll({ where: { status: "Accepted" }, order: [["createdAt", "DESC"]] }),
  ]);

  const studentsByUserId = new Map(placementStudents.map((student) => [student.userId, student]));
  const acceptedOfferByStudentId = new Map();
  acceptedOffers.forEach((offer) => {
    if (offer.studentId && !acceptedOfferByStudentId.has(offer.studentId)) {
      acceptedOfferByStudentId.set(offer.studentId, offer);
    }
  });

  return users.map((user) => {
    const student = studentsByUserId.get(user.id);
    const offer = acceptedOfferByStudentId.get(user.id);
    return {
      id: user.id,
      rollNo: student?.rollNo || null,
      name: user.name,
      branch: student?.branch || null,
      year: student?.batchYear ?? null,
      cgpa: student?.cgpa ?? null,
      backlogs: student?.backlogs ?? null,
      placementStatus: offer ? "Placed" : "Not Started",
      company: offer?.companyName || null,
      role: offer?.role || null,
      package: offer?.ctc || null,
      sector: offer?.sector || null,
    };
  });
};

export const getProfessorPrograms = async (professorId) => {
  const courses = await PlacementTrainingCourse.findAll({ order: [["startDate", "ASC"]] });
  const instructedCourses = courses.filter((course) => {
    const instructorIds = Array.isArray(course.instructorIds) ? course.instructorIds : [];
    return instructorIds.includes(professorId);
  });

  return Promise.all(instructedCourses.map(async (course) => {
    const [enrollments, tests] = await Promise.all([
      PlacementCourseEnrollment.findAll({ where: { courseId: course.id }, order: [["enrolledAt", "ASC"]] }),
      PlacementTrainingTest.findAll({ where: { courseId: course.id }, order: [["date", "ASC"], ["testNumber", "ASC"]] }),
    ]);

    const students = await Promise.all(enrollments.map(async (enrollment) => {
      const [user, placementStudent] = await Promise.all([
        User.findByPk(enrollment.studentId, { attributes: ["id", "name"] }),
        PlacementStudent.findOne({
          where: { userId: enrollment.studentId },
          attributes: ["name", "rollNo", "email", "branch"],
        }),
      ]);
      return shapeProfessorProgramStudent(enrollment, user, placementStudent);
    }));

    return {
      course: shapeProfessorProgramCourse(course),
      students,
      tests: tests.map((test) => test.toJSON()),
    };
  }));
};

export const getPlacementApplications = async () => {
  const applications = await PlacementApplication.findAll({
    include: [{ model: PlacementJob, as: "job", required: false }],
    order: [["appliedAt", "DESC"]],
  });
  return applications.map(shapeApplication);
};

export const getCompanies = async () => {
  const companies = await PlacementCompany.findAll({ order: [["name", "ASC"]] });
  return companies.map(shapeCompany);
};

export const getCompany = async (id) => {
  const company = await PlacementCompany.findByPk(id);
  if (!company) {
    const err = new Error("Company not found");
    err.statusCode = 404;
    throw err;
  }
  return shapeCompany(company);
};

export const getTrainingInstructors = async () => {
  return User.findAll({
    where: { role: "professor" },
    attributes: ["id", "name", "email", "role", "department"],
    order: [["name", "ASC"]],
  });
};
