import * as service from "./job-tray-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const getPendingJobs = asyncHandler(async (req, res) => {
  const jobs = await service.getPendingJobs(req.user.id);
  res.status(200).json({ success: true, data: jobs });
});

export const markJobDone = asyncHandler(async (req, res) => {
  const job = await service.markJobDone(req.params.jobId, req.user.id);
  res.status(200).json({ success: true, data: job });
});