import { getAllUsers, getUserById, updateUser, deleteUser } from "./user-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const getUsers = asyncHandler(async (req, res) => {
  const users = await getAllUsers();
  res.status(200).json({ success: true, data: users });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  res.status(200).json({ success: true, data: user });
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await updateUser(req.params.id, req.body);
  res.status(200).json({ success: true, data: user });
});

export const removeUser = asyncHandler(async (req, res) => {
  await deleteUser(req.params.id);
  res.status(200).json({ success: true, message: "User deleted" });
});
