import express from "express";
import * as ctrl from "./leave-controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

// All routes below require authentication
router.use(protect);

router.get("/applications", ctrl.getApplications);
router.post("/apply", ctrl.createApplication);
router.post("/update/:id", ctrl.updateApplication);
router.get("/incoming-requests", ctrl.getIncomingRequests);
router.post("/approve/:id", ctrl.updateApproval);
router.post("/substitutions/:id", ctrl.respondToSubstitution);

export default router;
