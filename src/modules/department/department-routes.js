import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import { list, get, create, update, remove } from "./department-controller.js";

const router = express.Router();

router.get("/", protect, list);
router.get("/:id", protect, get);
router.post("/", protect, authorize("admin"), create);
router.put("/:id", protect, authorize("admin"), update);
router.delete("/:id", protect, authorize("admin"), remove);

export default router;