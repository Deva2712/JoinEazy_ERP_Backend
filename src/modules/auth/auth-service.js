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

// ─── In-memory OTP store (simple — production mein Redis use karo) ─────────────
const otpStore = new Map(); // email → { otp, expiresAt }

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// ─── INITIATE REGISTRATION — send OTP ─────────────────────────────────────────
export const initiateRegistrationService = async (email) => {
  // Check if already registered
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const err = new Error("Email already registered"); err.statusCode = 409; throw err;
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins
  otpStore.set(`register:${email}`, { otp, expiresAt });

  // Send email
  try {
    const { sendMail } = await import("../../config/mailer.js");
    await sendMail({
      to: email,
      subject: "JoinEazy — Email Verification Code",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:8px">
          <h2 style="color:#6C63FF">Verify your email</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing:8px;color:#333;font-size:36px">${otp}</h1>
          <p style="color:#888;font-size:13px">This code expires in 10 minutes.</p>
        </div>
      `,
    });
  } catch (mailErr) {
    console.error("Mail error:", mailErr.message);
    // Dev fallback — log OTP
    console.log(`[DEV] OTP for ${email}: ${otp}`);
  }

  return { message: "OTP sent to your email" };
};

// ─── COMPLETE REGISTRATION — verify OTP + create user ─────────────────────────
export const completeRegistrationService = async (email, password, otp) => {
  const key = `register:${email}`;
  const stored = otpStore.get(key);

  if (!stored) {
    const err = new Error("OTP not found. Please initiate registration again."); err.statusCode = 400; throw err;
  }
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(key);
    const err = new Error("OTP expired. Please request a new one."); err.statusCode = 400; throw err;
  }
  if (stored.otp !== otp) {
    const err = new Error("Invalid OTP"); err.statusCode = 400; throw err;
  }

  otpStore.delete(key);

  // Determine role from email domain
  const role = "student"; // default — can be changed later by admin

  const user = await User.create({ name: email.split("@")[0], email, password, role });
  const token = generateToken({ id: user.id, role: user.role });

  return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token };
};

// ─── PASSWORD RESET — initiate ────────────────────────────────────────────────
export const initiatePasswordResetService = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    // Don't reveal if email exists
    return { message: "If this email is registered, you will receive a reset code." };
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  otpStore.set(`reset:${email}`, { otp, expiresAt });

  try {
    const { sendMail } = await import("../../config/mailer.js");
    await sendMail({
      to: email,
      subject: "JoinEazy — Password Reset Code",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:8px">
          <h2 style="color:#6C63FF">Reset your password</h2>
          <p>Your reset code is:</p>
          <h1 style="letter-spacing:8px;color:#333;font-size:36px">${otp}</h1>
          <p style="color:#888;font-size:13px">This code expires in 10 minutes.</p>
        </div>
      `,
    });
  } catch (mailErr) {
    console.error("Mail error:", mailErr.message);
    console.log(`[DEV] Reset OTP for ${email}: ${otp}`);
  }

  return { message: "Reset code sent to your email" };
};

// ─── PASSWORD RESET — verify OTP ─────────────────────────────────────────────
export const verifyPasswordResetOTPService = async (email, otp) => {
  const key = `reset:${email}`;
  const stored = otpStore.get(key);

  if (!stored || Date.now() > stored.expiresAt) {
    const err = new Error("OTP expired or not found"); err.statusCode = 400; throw err;
  }
  if (stored.otp !== otp) {
    const err = new Error("Invalid OTP"); err.statusCode = 400; throw err;
  }

  // Mark as verified (keep for complete step)
  otpStore.set(key, { ...stored, verified: true });
  return { message: "OTP verified successfully" };
};

// ─── PASSWORD RESET — complete ────────────────────────────────────────────────
export const completePasswordResetService = async (email, otp, newPassword) => {
  const key = `reset:${email}`;
  const stored = otpStore.get(key);

  if (!stored || !stored.verified) {
    const err = new Error("Please verify OTP first"); err.statusCode = 400; throw err;
  }
  if (stored.otp !== otp) {
    const err = new Error("Invalid OTP"); err.statusCode = 400; throw err;
  }

  otpStore.delete(key);

  const user = await User.findOne({ where: { email } });
  if (!user) { const err = new Error("User not found"); err.statusCode = 404; throw err; }

  await user.update({ password: newPassword });
  return { message: "Password reset successfully" };
};
