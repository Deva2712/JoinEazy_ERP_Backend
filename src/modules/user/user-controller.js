import { getAllUsers, getUserById, updateUser, deleteUser } from "./user-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const getUsers = asyncHandler(async (req, res) => {
  const users = await getAllUsers(req.query); // supports ?role=professor
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
// GET /api/v1/users/dashboard-overview
export const getDashboardOverview = asyncHandler(async (req, res) => {
  const { Cohort, CohortParticipant } = await import("../cohort/cohort-model.js");
  const { Op } = await import("sequelize");
  const userId = req.user.id;

  const createdCohorts = await Cohort.findAll({
    where: { creator_id: userId, visibility: { [Op.ne]: "Archived" } },
    order: [["created_at", "DESC"]],
  });

  const participations = await CohortParticipant.findAll({
    where: { user_id: userId },
    include: [{
      model: Cohort, as: "cohort",
      where: { creator_id: { [Op.ne]: userId }, visibility: { [Op.ne]: "Archived" } },
      required: true,
    }],
  });

  const format = (c) => ({
    id: c.id, cohort_name: c.cohort_name, name: c.cohort_name,
    cohort_description: c.cohort_description, status: c.status || "Live",
    creator_id: c.creator_id, is_admin: c.creator_id === userId,
    user_type: c.creator_id === userId ? 1 : 0,
    start_date: c.start_date, end_date: c.end_date, created_at: c.created_at,
  });

  res.json({
    success: true,
    data: {
      user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role },
      createdCohorts: createdCohorts.map(format),
      joinedCohorts: participations.map(p => format(p.cohort)),
    },
  });
});