import express from "express";
import { register, login, changePassword, initiateRegistration, completeRegistration,
         initiatePasswordReset, verifyPasswordResetOTP, completePasswordReset } from "./auth-controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

// ─── Legacy ───────────────────────────────────────────────────────────────────
router.post("/register", register);
router.post("/login", login);

// ─── OTP Registration flow ────────────────────────────────────────────────────
router.post("/register/initiate", initiateRegistration);   // send OTP
router.post("/register/complete", completeRegistration);   // verify OTP + create user

// ─── Password Reset flow ──────────────────────────────────────────────────────
router.post("/password/reset/initiate", initiatePasswordReset);  // send reset OTP
router.post("/password/reset/verify",   verifyPasswordResetOTP); // verify OTP
router.post("/password/reset/complete", completePasswordReset);  // set new password

// ─── Status ───────────────────────────────────────────────────────────────────
router.get("/status", protect, async (req, res) => {
 
  const User = (await import("./auth-model.js")).default;
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ["password"] }
  });
  
  if (!user) {
    return res.status(401).json({ success: false, message: "User not found" });
  }
  
  res.status(200).json({
    success: true,
    user: user.toJSON()
  });
});

// ─── Refresh token ────────────────────────────────────────────────────────────
router.post("/change-password", protect, changePassword);

router.post("/refresh-token", protect, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

export default router;
