import User from "../auth/auth-model.js";

export const getAllUsers = async (filters = {}) => {
  const where = {};
  if (filters.role) where.role = filters.role;
  return User.findAll({
    where,
    attributes: { exclude: ["password"] },
  });
};

export const getUserById = async (id) => {
  const user = await User.findByPk(id, {
    attributes: { exclude: ["password"] },
  });
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  return user;
};

export const updateUser = async (id, data) => {
  const user = await getUserById(id);
  await user.update(data);
  return user;
};

export const deleteUser = async (id) => {
  const user = await getUserById(id);
  await user.destroy();
};