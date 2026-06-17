import { JobTrayItem } from "./job-tray-model.js";

export const getPendingJobs = async (userId) => {
  const jobs = await JobTrayItem.findAll({
    where: { user_id: userId, status: "pending" },
    order: [["createdAt", "DESC"]],
  });
  return jobs.map(j => j.toJSON());
};

export const markJobDone = async (jobId, userId) => {
  const job = await JobTrayItem.findOne({ where: { id: jobId, user_id: userId } });
  if (!job) { const e = new Error("Job not found"); e.statusCode = 404; throw e; }
  await job.update({ status: "completed" });
  return job.toJSON();
};