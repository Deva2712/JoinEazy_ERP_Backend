import { BugReport } from "./bug-reports-model.js";

export const createBugReport = async (userId, userName, userEmail, data) => {
  const report = await BugReport.create({
    reported_by: userId,
    reporter_name: userName,
    reporter_email: userEmail,
    title:       data.title || data.subject || "Bug Report",
    description: data.description || data.message,
    category:    data.category || null,
    severity:    data.severity || "medium",
    page_url:    data.pageUrl || data.page_url || null,
    screenshot_url: data.screenshotUrl || null,
  });
  return report.toJSON();
};

export const getBugReports = async (userId, userRole) => {
  const isAdmin = ["admin", "staff"].includes(userRole);
  const where = isAdmin ? {} : { reported_by: userId };
  const reports = await BugReport.findAll({ where, order: [["created_at", "DESC"]] });
  return reports.map(r => r.toJSON());
};
