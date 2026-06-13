import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { list, read } from "./notifications-controller.js";

const router = express.Router();

router.get("/", protect, list);
router.patch("/:id/read", protect, read);

export default router;