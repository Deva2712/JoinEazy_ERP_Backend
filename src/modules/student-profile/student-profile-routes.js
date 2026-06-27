import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { upload } from "../../middleware/upload.middleware.js";
import * as ctrl from "./student-profile-controller.js";

const router = express.Router();
router.use(protect);

router.get("/profile",            ctrl.getProfile);
router.put("/profile",            ctrl.updateProfile);
router.put("/profile/portfolio",  ctrl.updatePortfolio);
router.post("/profile/documents", ...upload("file", "student-profile/documents"), ctrl.uploadDocument);
router.get("/profile/documents",  ctrl.getDocuments);

export default router;