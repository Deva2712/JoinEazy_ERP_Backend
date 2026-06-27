// src/modules/upload/upload-routes.js
import express from "express";
import multer from "multer";
import { protect } from "../../middleware/auth.middleware.js";
import { uploadToS3 } from "../../middleware/upload.middleware.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

const router = express.Router();
const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});


const FOLDER_BY_TYPE = {
  "0": "profile-pictures",       // uploadProfilePicture sends type "0"
  post_cover: "cohort-board/covers",
  finance_proof: "finance/proof-docs",
};

router.post(
  "/file",
  protect,
  multerUpload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const folder = FOLDER_BY_TYPE[req.body?.type] || "misc";
    const { url, key } = await uploadToS3(req.file, folder);

    res.status(201).json({
      success: true,
      data: {
        fileUrl: url,
        key,
        path: key, 
      },
    });
  })
);

export default router;