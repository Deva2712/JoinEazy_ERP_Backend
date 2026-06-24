// src/modules/cohort-members/cohort-members-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./cohort-members-service.js";
import { CohortGroup, CohortGroupMember } from "../cohort/cohort-model.js";

export const getMembers = asyncHandler(async (req, res) => {
  const data = await svc.getMembers(req.params.cohortId, req.query);

  const groups = await CohortGroup.findAll({
    where: { cohort_id: req.params.cohortId },
    include: [{ model: CohortGroupMember, as: "CohortGroupMembers" }],
  });

  res.json({
    success: true,
    data: {
      participants: data.members.map(m => ({
        email: m.email,
        user_details: {
          user_id:      m.user_id,
          display_name: m.name,
          username:     m.name,
          profile_pic:  m.avatar,
          is_active:    true,
          created_at:   m.createdAt,
        }
      })),
      groups:   groups.map(g => g.toJSON()),
      is_group: groups.length > 0,
      total:    data.total,
      page:     data.page,
      limit:    data.limit,
    }
  });
});

export const addMember = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await svc.addMember(req.params.cohortId, req.body) });
});

export const removeMember = asyncHandler(async (req, res) => {
  await svc.removeMember(req.params.cohortId, req.params.userId);
  res.json({ success: true, message: "Member removed" });
});