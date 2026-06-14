import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./bug-reports-service.js";

export const createBugReport = asyncHandler(async (req, res) => {
  const data = await svc.createBugReport(req.user.id, req.user.name, req.user.email, req.body);
  res.status(201).json({ success: true, data, message: "Bug report submitted successfully" });
});

export const getBugReports = asyncHandler(async (req, res) => {
  const data = await svc.getBugReports(req.user.id, req.user.role);
  res.json({ success: true, data });
});
