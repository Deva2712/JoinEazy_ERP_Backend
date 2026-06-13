// src/modules/bulletins/bulletins-routes.js
import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as ctrl from "./bulletins-controller.js";

const router = express.Router();
router.use(protect);

// GET    /api/v1/bulletins?level=institution&priority=High
router.get("/", ctrl.getBulletins);

// POST   /api/v1/bulletins
router.post("/", ctrl.createBulletin);

// DELETE /api/v1/bulletins/:bulletinId
router.delete("/:bulletinId", ctrl.deleteBulletin);

export default router;