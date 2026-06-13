import { getStudentDashboardOverview, getProfessorDashboardOverview } from "./dashboard-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const overview = asyncHandler(async (req, res) => {
  const data = req.user.role === "student"
    ? await getStudentDashboardOverview(req.user.id)
    : await getProfessorDashboardOverview(req.user.id);
  res.status(200).json({ success: true, ...data });
});