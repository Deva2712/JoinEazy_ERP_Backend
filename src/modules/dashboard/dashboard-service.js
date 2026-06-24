import { Op } from "sequelize";
import User from "../auth/auth-model.js";

// Helper: calculate assignment stats for a cohort
const getAssignmentStats = async (cohortId, userId, isStudent) => {
  const { CohortAssignment } = await import("../cohort-assignments/cohort-assignments-model.js");

  const assignments = await CohortAssignment.findAll({ where: { cohort_id: cohortId } });
  const assignment_count = assignments.length;

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const due_this_week_assignment_count = assignments.filter(a => {
    if (!a.deadline) return false;
    const d = new Date(a.deadline);
    return d >= now && d <= weekFromNow;
  }).length;

  let completed_assignment_count = 0;

  if (isStudent) {
    try {
      const { AssignmentSubmission } = await import("../cohort-assignments/cohort-assignments-model.js");
      completed_assignment_count = await AssignmentSubmission.count({
        where: { assignment_id: assignments.map(a => a.id), student_id: userId },
      });
    } catch {
      completed_assignment_count = 0;
    }
  }

  return { assignment_count, due_this_week_assignment_count, completed_assignment_count };
};

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

  const format = async (c) => {
    const liveCount = await CohortParticipant.count({ where: { cohort_id: c.id } });
    const { assignment_count, due_this_week_assignment_count, completed_assignment_count } =
      await getAssignmentStats(c.id, userId, true);

    return {
      id: c.id, cohort_name: c.cohort_name, name: c.cohort_name, title: c.cohort_name,
      cohort_description: c.cohort_description, status: c.status || "Live",
      creator_id: c.creator_id, is_admin: false, user_type: 0,
      start_date: c.start_date, end_date: c.end_date, created_at: c.created_at,
      startDate: c.start_date, endDate: c.end_date,
      member_count: liveCount, memberCount: liveCount, studentCount: liveCount,
      group_count: c.group_count || 0,
      assignment_count, due_this_week_assignment_count, completed_assignment_count,
      link: `/c/${c.id}`,
      courseCodes: Array.isArray(c.course_codes) ? c.course_codes : (c.course_codes ? [c.course_codes] : []),
    };
  };

  const joinedCohorts = await Promise.all(participations.map(p => format(p.cohort)));

  return {
    data: {
      user,
      createdCohorts: [],
      joinedCohorts,
      stats: { attendance: 0, assignments_pending: 0, upcoming_events: 0 },
    }
  };
};

export const getProfessorDashboardOverview = async (userId) => {
  const { Cohort, CohortParticipant } = await import("../cohort/cohort-model.js");

  const user = await User.findByPk(userId, { attributes: { exclude: ["password"] } });

  const createdCohorts = await Cohort.findAll({
    where: { creator_id: userId, visibility: { [Op.ne]: "Archived" } },
    order: [["created_at", "DESC"]],
  });

  const format = async (c) => {
    const liveCount = await CohortParticipant.count({ where: { cohort_id: c.id } });
    const { assignment_count, due_this_week_assignment_count } =
      await getAssignmentStats(c.id, userId, false);

    return {
      id: c.id, cohort_name: c.cohort_name, name: c.cohort_name, title: c.cohort_name,
      cohort_description: c.cohort_description, status: c.status || "Live",
      creator_id: c.creator_id, is_admin: true, user_type: 1,
      start_date: c.start_date, end_date: c.end_date, created_at: c.created_at,
      startDate: c.start_date, endDate: c.end_date,
      member_count: liveCount, memberCount: liveCount, studentCount: liveCount,
      group_count: c.group_count || 0,
      assignment_count, due_this_week_assignment_count, completed_assignment_count: 0,
      link: `/c/${c.id}`,
      courseCodes: Array.isArray(c.course_codes) ? c.course_codes : (c.course_codes ? [c.course_codes] : []),
    };
  };

  const formattedCohorts = await Promise.all(createdCohorts.map(format));

  return {
    data: {
      user,
      createdCohorts: formattedCohorts,
      joinedCohorts: [],
      stats: { total_students: 0, pending_leaves: 0, upcoming_sessions: 0 },
    }
  };
};