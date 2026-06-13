// src/modules/asset-request/asset-request-routes.js
import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as ctrl from "./asset-request-controller.js";

const router = express.Router();
router.use(protect);

router.get("/list",              ctrl.getAssets);      // GET  /assets/list
router.get("/requests",          ctrl.getRequests);    // GET  /assets/requests
router.post("/requests",         ctrl.createRequest);  // POST /assets/requests
router.put("/requests/:requestId", ctrl.updateRequest); // PUT  /assets/requests/:id

export default router;