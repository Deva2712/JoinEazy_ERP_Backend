// src/modules/cohort/cohort-service.js
import { Op } from "sequelize";
import crypto from "crypto";
import { Cohort, CohortDetailSection, CohortGroup, CohortGroupMember, CohortParticipant } from "./cohort-model.js";
import User from "../auth/auth-model.js"; 

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateSlug = (name) =>
  name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);

const defaultDetailSections = (description) => [
  { title: "Course Overview",    subsec_description: description || "Welcome to this course!", order: 0 },
  { title: "Learning Objectives",subsec_description: "Core concepts, practical skills, teamwork.", order: 1 },
  { title: "Course Schedule",    subsec_description: "Weeks 1-2: Foundations | Weeks 3-5: Core Concepts", order: 2 },
  { title: "Prerequisites",      subsec_description: "Basic programming knowledge.", order: 3 },
  { title: "Grading Criteria",   subsec_description: "Assignments: 30% | Projects: 45% | Participation: 25%", order: 4 },
];

const formatCohort = (cohort, extras = {}) => {
  const json = cohort.toJSON ? cohort.toJSON() : cohort;
  return {
    ...json,
    // FIX: ensure course_codes is always an array
    course_codes:    Array.isArray(json.course_codes) ? json.course_codes : (json.course_codes ? [json.course_codes] : []),
    detail_sections: json.detail_sections || [],
    groups:          json.groups || [],
    participants:    json.participants || [],
    ...extras,
  };
};

// ─── GET by slug ──────────────────────────────────────────────────────────────
export const getCohortBySlug = async (slug) => {
  const cohort = await Cohort.findOne({ where: { slug }, include: [{ model: CohortDetailSection, as: "detail_sections" }] });
  if (!cohort) { const e = new Error("Cohort not found"); e.statusCode = 404; throw e; }
  return formatCohort(cohort);
};

// ─── GET by ID ────────────────────────────────────────────────────────────────
export const getCohortById = async (cohortId) => {
  const cohort = await Cohort.findByPk(cohortId);
  if (!cohort) { const e = new Error("Cohort not found"); e.statusCode = 404; throw e; }
  return formatCohort(cohort);
};

// ─── GET details (full) ───────────────────────────────────────────────────────
export const getCohortDetails = async (cohortId, userId, userRole) => {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cohortId);
  
  let cohort;
  if (isUUID) {
    cohort = await Cohort.findByPk(cohortId, {
      include: [{ model: CohortDetailSection, as: "detail_sections", order: [["order", "ASC"]] }],
    });
  } else {
    cohort = await Cohort.findOne({
      where: { slug: cohortId },
      include: [{ model: CohortDetailSection, as: "detail_sections", order: [["order", "ASC"]] }],
    });
    if (!cohort) {
      const all = await Cohort.findAll({ include: [{ model: CohortDetailSection, as: "detail_sections" }], order: [["created_at", "ASC"]] });
      const idx = parseInt(cohortId, 10);
      if (!isNaN(idx) && idx >= 1 && idx <= all.length) cohort = all[idx - 1];
    }
  }
  if (!cohort) { const e = new Error("Cohort not found"); e.statusCode = 404; throw e; }

  const isAdmin = userRole === "professor" || userRole === "admin";

  let groupName = null;
  let isGroupLeader = false;
  if (!isAdmin) {
    const userGroup = await CohortGroupMember.findOne({
      where: { user_id: userId },
      include: [{ model: CohortGroup, as: "group", where: { cohort_id: cohortId }, required: true }],
    });
    if (userGroup) {
      groupName = userGroup.group?.group_name || null;
      isGroupLeader = userGroup.role === "leader";
    }
  }

  // FIX: calculate real assignment counts instead of hardcoded 0
  const { CohortAssignment, AssignmentSubmission } = await import("../cohort-assignments/cohort-assignments-model.js");
  const assignments = await CohortAssignment.findAll({ where: { cohort_id: cohort.id } });
  const total_assignments = assignments.length;

  let completed_assignments = 0;
  if (!isAdmin && assignments.length > 0) {
    try {
      completed_assignments = await AssignmentSubmission.count({
        where: { assignment_id: assignments.map(a => a.id), student_id: userId },
      });
    } catch {
      completed_assignments = 0;
    }
  }
  const pending_assignments = isAdmin ? total_assignments : Math.max(total_assignments - completed_assignments, 0);

  // FIX: real member count instead of relying on stale stored column
  const member_count = await CohortParticipant.count({ where: { cohort_id: cohort.id } });

  const json = cohort.toJSON();
  return {
    ...json,
    // FIX: ensure course_codes is always an array
    course_codes:          Array.isArray(json.course_codes) ? json.course_codes : (json.course_codes ? [json.course_codes] : []),
    is_admin:              isAdmin,
    user_type:             isAdmin ? 1 : 0,
    pending_assignments,
    completed_assignments,
    total_assignments,
    assignment_count:      total_assignments,
    member_count,
    memberCount:           member_count,
    studentCount:          member_count,
    group_name:            groupName,
    is_group_leader:       isGroupLeader,
    detail_sections:       json.detail_sections || defaultDetailSections(json.cohort_description),
  };
};

// ─── GET archived cohorts ────────────────────────────────────────────────────
export const getArchivedCohorts = async (userId) => {
  const cohorts = await Cohort.findAll({
    where: {
      status: "Archived",
      [Op.or]: [{ creator_id: userId }],
    },
  });
  return cohorts.map((c) => formatCohort(c));
};

// ─── CREATE cohort ────────────────────────────────────────────────────────────
export const createCohort = async (data, creator) => {
  const slug = generateSlug(data.cohort_name || data.name || "cohort");
  // FIX: ensure course_codes stored as array
const course_codes = Array.isArray(data.course_codes)
    ? data.course_codes.join(",")
    : (data.course_codes || null);

  const cohort = await Cohort.create({
    cohort_name:        data.cohort_name || data.name,
    cohort_description: data.cohort_description || data.description || null,
    course_codes,
    slug,
    organization_name:  data.organization_name || "Mahindra University",
    instructor:         creator.name,
    creator_id:         creator.id,
    creator_name:       creator.name,
    start_date:         data.start_date || null,
    end_date:           data.end_date || null,
    status:             "Live",
    visibility:         "Active",
  });

  const sections = defaultDetailSections(data.cohort_description);
  await CohortDetailSection.bulkCreate(sections.map((s, i) => ({ ...s, cohort_id: cohort.id, order: i })));

  const full = await Cohort.findByPk(cohort.id, {
    include: [{ model: CohortDetailSection, as: "detail_sections" }],
  });
  return formatCohort(full);
};

// ─── UPDATE cohort ────────────────────────────────────────────────────────────
export const updateCohort = async (cohortId, data, userId) => {
  const cohort = await Cohort.findByPk(cohortId);
  if (!cohort) { const e = new Error("Cohort not found"); e.statusCode = 404; throw e; }
  if (cohort.creator_id !== userId) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }

  // FIX: ensure course_codes stored as array
let course_codes = cohort.course_codes;
if (data.course_codes !== undefined) {
    course_codes = Array.isArray(data.course_codes)
        ? data.course_codes.join(",")
        : (data.course_codes || null);
}

  await cohort.update({
    cohort_name:        data.cohort_name        ?? cohort.cohort_name,
    cohort_description: data.cohort_description ?? cohort.cohort_description,
    course_codes,
    start_date:         data.start_date         ?? cohort.start_date,
    end_date:           data.end_date           ?? cohort.end_date,
    status:             data.status             ?? cohort.status,
    visibility:         data.visibility         ?? cohort.visibility,
    max_groups_members: data.max_groups_members ?? cohort.max_groups_members,
    max_course_members: data.max_course_members ?? cohort.max_course_members,
  });
  return formatCohort(cohort);
};

// ─── DELETE cohort ────────────────────────────────────────────────────────────
export const deleteCohort = async (cohortId, userId) => {
  const cohort = await Cohort.findByPk(cohortId);
  if (!cohort) { const e = new Error("Cohort not found"); e.statusCode = 404; throw e; }
  if (cohort.creator_id !== userId) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }
  await cohort.destroy();
  return { deleted: true };
};

// ─── ARCHIVE cohort ───────────────────────────────────────────────────────────
export const archiveCohort = async (cohortId, userId) => {
  const cohort = await Cohort.findByPk(cohortId);
  if (!cohort) { const e = new Error("Cohort not found"); e.statusCode = 404; throw e; }
  if (cohort.creator_id !== userId) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }
  await cohort.update({ status: "Archived", visibility: "Archived" });
  return formatCohort(cohort);
};

// ─── CHECK & AUTO-ARCHIVE EXPIRED ────────────────────────────────────────────
export const checkAndArchiveExpired = async () => {
  const now = new Date();
  const [count] = await Cohort.update(
    { status: "Archived", visibility: "Archived" },
    { where: { end_date: { [Op.lt]: now }, status: { [Op.ne]: "Archived" } } }
  );
  return { archivedCount: count, message: `${count} course(s) auto-archived` };
};

// ─── DETAIL SECTIONS ─────────────────────────────────────────────────────────
export const addDetailSection = async (cohortId, data) => {
  const count = await CohortDetailSection.count({ where: { cohort_id: cohortId } });
  const section = await CohortDetailSection.create({
    cohort_id: cohortId, title: data.title, subsec_description: data.subsec_description || "", order: count,
  });
  return section.toJSON();
};

export const editDetailSection = async (cohortId, detailId, data) => {
  const section = await CohortDetailSection.findOne({ where: { id: detailId, cohort_id: cohortId } });
  if (!section) { const e = new Error("Section not found"); e.statusCode = 404; throw e; }
  await section.update({ title: data.title ?? section.title, subsec_description: data.subsec_description ?? section.subsec_description });
  return section.toJSON();
};

export const deleteDetailSection = async (cohortId, detailId) => {
  const section = await CohortDetailSection.findOne({ where: { id: detailId, cohort_id: cohortId } });
  if (!section) { const e = new Error("Section not found"); e.statusCode = 404; throw e; }
  await section.destroy();
  return { deleted: true };
};

// ─── GROUPS ───────────────────────────────────────────────────────────────────
export const createGroup = async (cohortId, data, creator) => {
  const group = await CohortGroup.create({
    cohort_id:         cohortId,
    group_name:        data.group_name || data.name,
    group_description: data.group_description || null,
    project_name:      data.project_name || null,
    max_members:       data.max_members || 4,
  });

  const isProfessor = creator.role === "professor" || creator.userType === 1 || data.creatorIsProfessor === true;

  if (isProfessor) {
    // Prof group create kar raha hai — prof group me add nahi hoga
    // Pehla selected member leader banega
    if (data.members && Array.isArray(data.members) && data.members.length > 0) {
      const [firstMember, ...restMembers] = data.members;

      // Pehle member ko leader banao
      await CohortGroupMember.create({
        group_id: group.id,
        user_id:  firstMember,
        role:     "leader",
      });

      // Baaki members ko normal member banao
      if (restMembers.length > 0) {
        await Promise.all(
          restMembers.map(userId =>
            CohortGroupMember.findOrCreate({
              where:    { group_id: group.id, user_id: userId },
              defaults: { role: "member" },
            })
          )
        );
      }
    }
  } else {
    // Student group create kar raha hai — wo khud leader hai
    await CohortGroupMember.create({
      group_id: group.id, user_id: creator.id, email: creator.email, role: "leader",
    });

    // Selected members add karo
    if (data.members && Array.isArray(data.members) && data.members.length > 0) {
      await Promise.all(
        data.members.map(userId =>
          CohortGroupMember.findOrCreate({
            where:    { group_id: group.id, user_id: userId },
            defaults: { role: "member" },
          })
        )
      );
    }
  }

  await Cohort.increment("group_count", { where: { id: cohortId } });
  return group.toJSON();
};
export const updateGroup = async (cohortId, groupId, data, userId) => {
  const group = await CohortGroup.findOne({ where: { id: groupId, cohort_id: cohortId } });
  if (!group) { const e = new Error("Group not found"); e.statusCode = 404; throw e; }
  await group.update({ group_name: data.group_name ?? group.group_name, group_description: data.group_description ?? group.group_description, project_name: data.project_name ?? group.project_name });
  return group.toJSON();
};

export const deleteGroup = async (cohortId, groupId, userId, userRole) => {
  const group = await CohortGroup.findOne({ where: { id: groupId, cohort_id: cohortId } });
  if (!group) { const e = new Error("Group not found"); e.statusCode = 404; throw e; }
  await group.destroy();
  await Cohort.decrement("group_count", { where: { id: cohortId } });
  return { deleted: true };
};

export const getGroupDetails = async (cohortId, groupId) => {
  const group = await CohortGroup.findOne({
    where: { id: groupId, ...(cohortId ? { cohort_id: cohortId } : {}) },
    include: [{ model: CohortGroupMember, as: "CohortGroupMembers" }],
  });
  if (!group) { const e = new Error("Group not found"); e.statusCode = 404; throw e; }

  const json = group.toJSON();
  const rawMembers = json.CohortGroupMembers || [];

  // FIX: fetch real user info for each member, build frontend-expected nested shape
  const userIds = rawMembers.map((m) => m.user_id).filter(Boolean);
  const users = userIds.length ? await User.findAll({ where: { id: userIds } }) : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const members = rawMembers.map((m) => {
    const u = userMap.get(m.user_id);
    return {
      is_admin:  m.role === "leader",
      joined_at: m.joined_at,
      user: {
        user_id:      m.user_id,
        display_name: u?.name || m.email?.split("@")[0] || "Unknown",
        username:     u?.name || m.email?.split("@")[0] || "Unknown",
        email:        u?.email || m.email,
        profile_pic:  u?.profile_pic || null,
      },
    };
  });

  const leader = members.find((m) => m.is_admin);

  return {
    group:  json,
    members,
    leader: leader || null,
  };
};

export const inviteGroupMember = async (cohortId, groupId, data) => {
  const group = await CohortGroup.findOne({ where: { id: groupId, cohort_id: cohortId } });
  if (!group) { const e = new Error("Group not found"); e.statusCode = 404; throw e; }
  const token = crypto.randomBytes(16).toString("hex");
  await group.update({ invite_token: token });
  return { invite_token: token, group_id: groupId };
};

export const acceptGroupInvite = async (token, userId, email) => {
  const group = await CohortGroup.findOne({ where: { invite_token: token } });
  if (!group) { const e = new Error("Invalid invite token"); e.statusCode = 404; throw e; }
  const [member, created] = await CohortGroupMember.findOrCreate({
    where: { group_id: group.id, user_id: userId },
    defaults: { email, role: "member" },
  });
  return { member: member.toJSON(), created };
};

export const removeGroupMember = async (groupId, targetUserId) => {
  const member = await CohortGroupMember.findOne({ where: { group_id: groupId, user_id: targetUserId } });
  if (!member) { const e = new Error("Member not found"); e.statusCode = 404; throw e; }
  await member.destroy();
  return { deleted: true };
};

export const addMembersToGroup = async (groupId, memberUserIds) => {
  const group = await CohortGroup.findByPk(groupId);
  if (!group) { const e = new Error("Group not found"); e.statusCode = 404; throw e; }
  
   const cohort = await Cohort.findByPk(group.cohort_id);
  const maxMembers = cohort?.max_groups_members || 4; 

  const currentCount = await CohortGroupMember.count({ where: { group_id: groupId } });
  if (currentCount + memberUserIds.length > maxMembers) {
    const e = new Error(`Group is full. Max ${maxMembers} members allowed.`);
    e.statusCode = 400;
    throw e;
  }

  const results = await Promise.all(
    memberUserIds.map((userId) =>
      CohortGroupMember.findOrCreate({ where: { group_id: groupId, user_id: userId }, defaults: { role: "member" } })
    )
  );
  return results.map(([m]) => m.toJSON());
};

export const getAvailableMembers = async (cohortId, groupId) => {
  const groupMembers = await CohortGroupMember.findAll({ where: { group_id: groupId }, attributes: ["user_id"] });
  const groupMemberIds = groupMembers.map((m) => m.user_id);
  const participants = await CohortParticipant.findAll({
    where: { cohort_id: cohortId, user_id: { [Op.notIn]: groupMemberIds.length ? groupMemberIds : ["none"] } },
  });
  return participants.map((p) => p.toJSON());
};

// ─── INVITATION LINK ──────────────────────────────────────────────────────────
export const generateInvitationLink = async (cohortId, userId) => {
  const cohort = await Cohort.findByPk(cohortId);
  if (!cohort) { const e = new Error("Cohort not found"); e.statusCode = 404; throw e; }
  if (cohort.creator_id !== userId) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }
  const token = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await cohort.update({ invitation_token: token, invitation_expires: expires });
  return { token, expires_at: expires };
};

export const getInvitationInfo = async (token) => {
  const cohort = await Cohort.findOne({ where: { invitation_token: token, invitation_expires: { [Op.gt]: new Date() } } });
  if (!cohort) { const e = new Error("Invalid or expired invitation"); e.statusCode = 404; throw e; }
  return { cohort_name: cohort.cohort_name, cohort_id: cohort.id, status: cohort.status };
};

export const joinWithInvitation = async (token, user) => {
  const cohort = await Cohort.findOne({ where: { invitation_token: token, invitation_expires: { [Op.gt]: new Date() } } });
  if (!cohort) { const e = new Error("Invalid or expired invitation"); e.statusCode = 400; throw e; }
  const [participant, created] = await CohortParticipant.findOrCreate({
    where: { cohort_id: cohort.id, email: user.email },
    defaults: { user_id: user.id, display_name: user.name, username: user.name, is_active: true },
  });
  if (created) await Cohort.increment("member_count", { where: { id: cohort.id } });
  return { cohort_id: cohort.id, cohort_name: cohort.cohort_name, already_joined: !created };
};

// ─── PARTICIPANTS (Excel upload) ──────────────────────────────────────────────
export const uploadParticipants = async (cohortId, participants) => {
  const UserModel = (await import("../auth/auth-model.js")).default;
  const CohortMember = (await import("../cohort-members/cohort-members-model.js")).default;

  const results = await Promise.all(
    participants.map(async (p) => {
      const user = await UserModel.findOne({ where: { email: p.email } });

      // CohortParticipant mein add karo
      const [participant, created] = await CohortParticipant.findOrCreate({
        where: { cohort_id: cohortId, email: p.email },
        defaults: {
          user_id:      user?.id || null,
          display_name: user?.name || p.email.split("@")[0],
          username:     user?.name || p.email.split("@")[0],
          is_active:    true,
        },
      });

      // CohortMember mein bhi add karo — attendance ke liye
      if (user) {
        await CohortMember.findOrCreate({
          where: { cohort_id: cohortId, user_id: user.id },
          defaults: {
            name:  user.name,
            email: user.email,
            role:  "student",
          },
        });
      }

      return [participant, created];
    })
  );

  const added = results.filter(([, created]) => created).length;
  await Cohort.update(
    { member_count: await CohortParticipant.count({ where: { cohort_id: cohortId } }) },
    { where: { id: cohortId } }
  );
  return { added, total: participants.length };
};

export const removeParticipant = async (cohortId, targetUserId) => {
  const participant = await CohortParticipant.findOne({ where: { cohort_id: cohortId, user_id: targetUserId } });
  if (!participant) { const e = new Error("Participant not found"); e.statusCode = 404; throw e; }
  await participant.destroy();
  await Cohort.decrement("member_count", { where: { id: cohortId } });
  return { deleted: true };
};

// ─── MEMBERS (with groups) ────────────────────────────────────────────────────
export const getCohortMembers = async (cohortId) => {
  const participants = await CohortParticipant.findAll({ where: { cohort_id: cohortId } });
  const groups = await CohortGroup.findAll({
    where: { cohort_id: cohortId },
    include: [{ model: CohortGroupMember, as: "CohortGroupMembers" }],
  });

  return {
    participants: participants.map((p) => ({
      email: p.email,
      user_details: {
        user_id:      p.user_id,
        display_name: p.display_name || p.roll_number,
        username:     p.username,
        profile_pic:  p.profile_pic,
        is_active:    p.is_active,
        created_at:   p.created_at,
      },
    })),
    groups: groups.map((g) => g.toJSON()),
    is_group: groups.length > 0,
  };
};

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
export const getLeaderboard = async (cohortId) => {
  const participants = await CohortParticipant.findAll({ where: { cohort_id: cohortId }, limit: 50 });
  return participants.map((p, i) => ({ rank: i + 1, name: p.username, score: 0, user_id: p.user_id }));
};

export const getIndividualLeaderboard = async (cohortId) => getLeaderboard(cohortId);

export const getGroupLeaderboard = async (cohortId) => {
  const groups = await CohortGroup.findAll({ where: { cohort_id: cohortId } });
  return groups.map((g, i) => ({ rank: i + 1, group_name: g.group_name, score: 0, group_id: g.id }));
};