// src/modules/maintenance/maintenance-routes.js
import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as ctrl from "./maintenance-controller.js";

const router = express.Router();
router.use(protect);

router.get("/my-requests",               ctrl.getMyRequests);  // GET  /maintenance/my-requests
router.post("/requests",                 ctrl.createRequest);  // POST /maintenance/requests
router.patch("/requests/:requestId/status", ctrl.updateStatus); // PATCH /maintenance/requests/:id/status

export default router;