// src/middleware/upload.middleware.js
import multer from "multer";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/png", "image/webp", "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  },
});

export const uploadToS3 = async (file, folder = "uploads") => {
  const ext = path.extname(file.originalname) || "";
  const key = `${folder}/${uuidv4()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  return { url, key };
};


export const upload = (fieldName, folder = "uploads") => [
  multerUpload.single(fieldName),
  async (req, res, next) => {
    if (!req.file) return next();
    try {
      const { url, key } = await uploadToS3(req.file, folder);
      req.fileUrl = url;
      req.fileKey = key;
      next();
    } catch (err) {
      next(err);
    }
  },
];