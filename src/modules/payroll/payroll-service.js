import Payroll from "./payroll-model.js";

export const getHistory = async (userId) => {
  const history = await Payroll.findAll({ where: { user_id: userId }, order: [["year","DESC"],["month","DESC"]] });
  return { history };
};

export const getBreakdown = async (userId, month, year) => {
  const currentMonth = month || new Date().toLocaleString("default",{month:"long"});
  const currentYear = year || new Date().getFullYear();
  const breakdown = await Payroll.findOne({ where: { user_id: userId, month: currentMonth, year: currentYear } });
  return { breakdown };
};