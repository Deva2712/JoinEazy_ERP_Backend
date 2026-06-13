import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { overview } from "./dashboard-controller.js";

const router = express.Router();

router.get("/dashboard-overview", protect, overview);

export default router;