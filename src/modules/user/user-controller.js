// src/modules/user/user-controller.js
import { getAllUsers, getUserById, updateUser, deleteUser } from "./user-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const getUsers = asyncHandler(async (req, res) => {
  const users = await getAllUsers(req.query);
  res.status(200).json({ success: true, data: users });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  res.status(200).json({ success: true, data: user });
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await updateUser(req.params.id, req.body);
  res.status(200).json({ success: true, data: user });
});

export const removeUser = asyncHandler(async (req, res) => {
  await deleteUser(req.params.id);
  res.status(200).json({ success: true, message: "User deleted" });
});

export const getDashboardOverview = asyncHandler(async (req, res) => {
  const { Cohort, CohortParticipant } = await import("../cohort/cohort-model.js");
  const { CohortAssignment, AssignmentSubmission } = await import("../cohort-assignments/cohort-assignments-model.js");
  const { Op } = await import("sequelize");
  const userId = req.user.id;

  // Cohorts created by this user
  const createdCohorts = await Cohort.findAll({
    where: { creator_id: userId, visibility: { [Op.ne]: "Archived" } },
    order: [["created_at", "DESC"]],
  });

  // Cohorts where user is a participant — FIX: no include, manual join
  const participations = await CohortParticipant.findAll({
    where: { user_id: userId },
    attributes: ["cohort_id"],
  });

  const joinedCohortIds = participations
    .map((p) => p.cohort_id)
    .filter((id) => !createdCohorts.find((c) => c.id === id));

  let joinedCohorts = [];
  if (joinedCohortIds.length > 0) {
    joinedCohorts = await Cohort.findAll({
      where: {
        id: { [Op.in]: joinedCohortIds },
        creator_id: { [Op.ne]: userId },
        visibility: { [Op.ne]: "Archived" },
      },
    });
  }

  // FIX: compute live member_count + assignment stats per cohort
  const format = async (c) => {
    const isOwner = c.creator_id === userId;

    const member_count = await CohortParticipant.count({ where: { cohort_id: c.id } });

    const assignments = await CohortAssignment.findAll({ where: { cohort_id: c.id } });
    const assignment_count = assignments.length;

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const due_this_week_assignment_count = assignments.filter(a => {
      if (!a.deadline) return false;
      const d = new Date(a.deadline);
      return d >= now && d <= weekFromNow;
    }).length;

    let completed_assignment_count = 0;
    if (!isOwner && assignments.length > 0) {
      try {
        completed_assignment_count = await AssignmentSubmission.count({
          where: { assignment_id: assignments.map(a => a.id), student_id: userId },
        });
      } catch {
        completed_assignment_count = 0;
      }
    }

    return {
      id:                 c.id,
      cohort_name:        c.cohort_name,
      name:               c.cohort_name,
      title:              c.cohort_name,
      cohort_description: c.cohort_description,
      course_codes:       Array.isArray(c.course_codes) ? c.course_codes : (c.course_codes ? [c.course_codes] : []),
      courseCodes:        Array.isArray(c.course_codes) ? c.course_codes : (c.course_codes ? [c.course_codes] : []),
      status:             c.status || "Live",
      creator_id:         c.creator_id,
      is_admin:           isOwner,
      user_type:          isOwner ? 1 : 0,
      start_date:         c.start_date,
      end_date:           c.end_date,
      startDate:          c.start_date,
      endDate:            c.end_date,
      created_at:         c.created_at,
      link:               `/c/${c.id}`,
      member_count, memberCount: member_count, studentCount: member_count,
      assignment_count, assignmentCount: assignment_count,
      due_this_week_assignment_count,
      completed_assignment_count,
      group_count: c.group_count || 0,
    };
  };

  const formattedCreated = await Promise.all(createdCohorts.map(format));
  const formattedJoined  = await Promise.all(joinedCohorts.map(format));

  res.json({
    success: true,
    data: {
      user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role },
      createdCohorts: formattedCreated,
      joinedCohorts:  formattedJoined,
    },
  });
});

// GET /api/v1/user/details?fields=...
export const getUserDetails = asyncHandler(async (req, res) => {
  const User = (await import("../auth/auth-model.js")).default;
  const fields = req.query.fields ? req.query.fields.split(",") : ["id", "name", "email", "role"];
  const user = await User.findByPk(req.user.id, { attributes: fields });
  res.json({ success: true, data: user });
});

// PUT /api/v1/user/settings
export const updateUserSettings = asyncHandler(async (req, res) => {
  const User = (await import("../auth/auth-model.js")).default;
  const user = await User.findByPk(req.user.id);
  if (!user) { return res.status(404).json({ success: false, message: "User not found" }); }

  const allowedFields = [
    "dateOfBirth", "gender", "employeeId", "department", "designation", "officeLocation",
    "permanentAddress", "currentAddress", "city", "state", "pinCode", "country",
    "mobileNumber", "alternateNumber", "personalEmail", "linkedinProfile",
    "panNumber", "aadhaarNumber", "profile_pic",
  ];

  const updates = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (req.body.fullName !== undefined) updates.name = req.body.fullName;
  // if (req.body.officialEmail !== undefined) updates.email = req.body.officialEmail;

  await user.update(updates);
  const { password, ...userData } = user.toJSON();
  res.json({ success: true, data: userData, message: "Settings updated successfully" });
});

// GET /api/v1/user/check-username?username=...
export const checkUsername = asyncHandler(async (req, res) => {
  const User = (await import("../auth/auth-model.js")).default;
  const { username } = req.query;
  if (!username) return res.status(400).json({ success: false, message: "username is required" });
  const existing = await User.findOne({ where: { email: username } });
  res.json({ success: true, data: { available: !existing } });
});

// POST /api/v1/user/bug-report
export const submitBugReport = asyncHandler(async (req, res) => {
  const { createBugReport } = await import("../bug-reports/bug-reports-service.js");
  const data = await createBugReport(req.user.id, req.user.name, req.user.email, req.body);
  res.status(201).json({ success: true, data, message: "Bug report submitted successfully" });
});