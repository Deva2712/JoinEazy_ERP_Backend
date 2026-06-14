import { registerUser, loginUser } from "./auth-service.js";
import User from "./auth-model.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const result = await registerUser({ name, email, password, role });
  res.status(201).json({ success: true, ...result });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await loginUser({ email, password });
  res.status(200).json({ success: true, ...result });
});

// ─── OTP Registration ─────────────────────────────────────────────────────────
export const initiateRegistration = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) { const e = new Error("Email is required"); e.statusCode = 400; throw e; }
  const data = await (await import("./auth-service.js")).initiateRegistrationService(email);
  res.json({ success: true, ...data });
});

export const completeRegistration = asyncHandler(async (req, res) => {
  const { email, password, otp } = req.body;
  if (!email || !password || !otp) { const e = new Error("Email, password and OTP are required"); e.statusCode = 400; throw e; }
  const data = await (await import("./auth-service.js")).completeRegistrationService(email, password, otp);
  res.status(201).json({ success: true, ...data });
});

// ─── Password Reset ───────────────────────────────────────────────────────────
export const initiatePasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) { const e = new Error("Email is required"); e.statusCode = 400; throw e; }
  const data = await (await import("./auth-service.js")).initiatePasswordResetService(email);
  res.json({ success: true, ...data });
});

export const verifyPasswordResetOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) { const e = new Error("Email and OTP are required"); e.statusCode = 400; throw e; }
  const data = await (await import("./auth-service.js")).verifyPasswordResetOTPService(email, otp);
  res.json({ success: true, ...data });
});

export const completePasswordReset = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) { const e = new Error("Email, OTP and new password are required"); e.statusCode = 400; throw e; }
  const data = await (await import("./auth-service.js")).completePasswordResetService(email, otp, newPassword);
  res.json({ success: true, ...data });
});

// POST /api/v1/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Current and new password are required" });
  }

  const bcrypt = (await import("bcryptjs")).default;
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return res.status(401).json({ success: false, message: "Current password is incorrect" });

  const hashed = await bcrypt.hash(newPassword, 10);
  await user.update({ password: hashed });

  res.json({ success: true, message: "Password changed successfully" });
});
