import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./expenses-service.js";

export const getExpenses    = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getExpenses(req.user.id) }));
export const createExpense  = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.createExpense(req.user.id, req.user.name, req.body) }));
export const updateExpense  = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.updateExpense(req.params.expenseId, req.user.id, req.body) }));
export const deleteExpense  = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.deleteExpense(req.params.expenseId, req.user.id) }));