import express from "express";
import multer from "multer";
import { protect } from "../../middleware/auth.middleware.js";
import * as ctrl from "./student-profile-controller.js";

const router = express.Router();
router.use(protect);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get("/profile",            ctrl.getProfile);
router.put("/profile",            ctrl.updateProfile);
router.put("/profile/portfolio",  ctrl.updatePortfolio);
router.post("/profile/documents", upload.single("file"), ctrl.uploadDocument);
router.get("/profile/documents",  ctrl.getDocuments);

export default router;
