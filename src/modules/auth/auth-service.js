import jwt from "jsonwebtoken";
import User from "./auth-model.js";

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

export const registerUser = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const err = new Error("Email already in use");
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({ name, email, password, role });
  const token = generateToken({ id: user.id, role: user.role });

  return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });

  if (!user || !(await user.matchPassword(password))) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error("Account is deactivated");
    err.statusCode = 403;
    throw err;
  }

  const token = generateToken({ id: user.id, role: user.role });
  return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token };
};
