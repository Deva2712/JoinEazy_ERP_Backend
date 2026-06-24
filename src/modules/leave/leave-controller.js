// src/modules/leave/leave-controller.js
import { getApplications, createApplication, updateApplication, updateApproval, respondToSubstitution } from "./leave-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const getLeaveApplications = asyncHandler(async (req, res) => {
  const result = await getApplications(req.user.id);
  res.status(200).json({
    success: true,
    data: {
      applications:         result.applications,
      substitutionRequests: result.substitutionRequests || [],
      managementContacts:   result.managementContacts || [],
      faculties:            result.faculties || [],
    },
  });
});

export const createLeaveApplication = asyncHandler(async (req, res) => {
  const result = await createApplication(req.user.id, req.user.name, req.body);
  res.status(201).json({ success: true, data: result.application });
});

export const updateLeaveApplication = asyncHandler(async (req, res) => {
  const result = await updateApplication(req.params.id, req.user.id, req.body);
  res.status(200).json({ success: true, data: result.application });
});

export const approveLeave = asyncHandler(async (req, res) => {
  const { role, action, remark } = req.body;
  const result = await updateApproval(req.params.id, role, action, remark);
  res.status(200).json({ success: true, data: result.application });
});

export const substituteResponse = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const result = await respondToSubstitution(req.params.id, req.user.id, action);
  res.status(200).json({ success: true, data: result.application });
});