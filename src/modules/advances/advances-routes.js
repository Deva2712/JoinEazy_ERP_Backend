import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as ctrl from "./advances-controller.js";

const router = express.Router();
router.use(protect);

router.get("/list",              ctrl.getAdvances);
router.post("/create",           ctrl.createAdvance);
router.patch("/:advanceId/update", ctrl.updateAdvance);
router.delete("/:advanceId",     ctrl.deleteAdvance);

export default router;