import { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment } from "./department-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const list = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await getDepartments()) });
});
export const get = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await getDepartment(req.params.id)) });
});
export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, ...(await createDepartment(req.body)) });
});
export const update = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await updateDepartment(req.params.id, req.body)) });
});
export const remove = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await deleteDepartment(req.params.id)) });
});