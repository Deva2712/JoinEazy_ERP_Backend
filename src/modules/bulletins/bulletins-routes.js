// src/modules/bulletins/bulletins-routes.js
import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { upload } from "../../middleware/upload.middleware.js";
import * as ctrl from "./bulletins-controller.js";

const router = express.Router();
router.use(protect);

router.get("/", ctrl.getBulletins);

router.post("/", ...upload("attachment", "bulletins"), ctrl.createBulletin);

router.delete("/:bulletinId", ctrl.deleteBulletin);

export default router;