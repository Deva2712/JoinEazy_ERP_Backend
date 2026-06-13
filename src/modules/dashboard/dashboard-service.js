import { Op } from "sequelize";
import User from "../auth/auth-model.js";

export const getStudentDashboardOverview = async (userId) => {
  const { Cohort, CohortParticipant } = await import("../cohort/cohort-model.js");

  const user = await User.findByPk(userId, { attributes: { exclude: ["password"] } });

  const participations = await CohortParticipant.findAll({
    where: { user_id: userId },
    include: [{
      model: Cohort, as: "cohort",
      where: { visibility: { [Op.ne]: "Archived" } },
      required: true,
    }],
  });

  const format = (c) => ({
    id: c.id, cohort_name: c.cohort_name, name: c.cohort_name,
    cohort_description: c.cohort_description, status: c.status || "Live",
    creator_id: c.creator_id, is_admin: false, user_type: 0,
    start_date: c.start_date, end_date: c.end_date, created_at: c.created_at,
  });

  return {
    data: {
      user,
      createdCohorts: [],
      joinedCohorts: participations.map(p => format(p.cohort)),
      stats: { attendance: 0, assignments_pending: 0, upcoming_events: 0 },
    }
  };
};

export const getProfessorDashboardOverview = async (userId) => {
  const { Cohort } = await import("../cohort/cohort-model.js");

  const user = await User.findByPk(userId, { attributes: { exclude: ["password"] } });

  const createdCohorts = await Cohort.findAll({
    where: { creator_id: userId, visibility: { [Op.ne]: "Archived" } },
    order: [["created_at", "DESC"]],
  });

  const format = (c) => ({
    id: c.id, cohort_name: c.cohort_name, name: c.cohort_name,
    cohort_description: c.cohort_description, status: c.status || "Live",
    creator_id: c.creator_id, is_admin: true, user_type: 1,
    start_date: c.start_date, end_date: c.end_date, created_at: c.created_at,
  });

  return {
    data: {
      user,
      createdCohorts: createdCohorts.map(format),
      joinedCohorts: [],
      stats: { total_students: 0, pending_leaves: 0, upcoming_sessions: 0 },
    }
  };
};