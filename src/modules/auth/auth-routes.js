import express from "express";
import { register, login } from "./auth-controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/status", protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});


export default router;
