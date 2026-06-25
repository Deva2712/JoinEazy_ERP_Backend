// src/modules/registrar/lor-routes.js
import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import { asyncHandler } from "../../middleware/error.middleware.js";
import { upload } from "../../middleware/upload.middleware.js";
import * as svc from "./registrar-service.js";

const router = express.Router();

// GET /lor/requests — prof gets inbox, student gets own requests
const capitalize = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
const normalizeLor = (r) => ({
  ...r,
  status:           capitalize(r.status),
  lorStatus:        capitalize(r.status),
  studentName:      r.student_name  || r.studentName  || "Student",
  studentRollNo:    r.student_roll  || r.studentRollNo || "",
  teacherName:      r.professor_name|| r.teacherName   || "Professor",
  requestedAt:      r.createdAt     || r.requestedAt   || new Date().toISOString(),
  professorRemarks: r.remarks       || r.professorRemarks || null,
  lorFileUrl:       r.lor_file_url  || r.lorFileUrl    || null,
  supportingDocFileName: r.supporting_doc_url || r.supportingDocFileName || null,
  urgency:          r.urgency       || null,
});

router.get("/requests", protect, asyncHandler(async (req, res) => {
  const data = await svc.getLorRequests(req.user.id, req.user.role);
  res.json({ success: true, data: data.map(normalizeLor) });
}));

// POST /lor/requests — student creates LOR request
router.post("/requests", protect, ...upload("file", "registrar/docs"), asyncHandler(async (req, res) => {
  const data = await svc.createLorRequest(req.user.id, req.body, req.file || null);
  res.status(201).json({ success: true, data });
}));

// DELETE /lor/requests/:id — student cancels their request
router.delete("/requests/:requestId", protect, asyncHandler(async (req, res) => {
  const data = await svc.cancelLorRequest(req.params.requestId, req.user.id);
  res.json({ success: true, data });
}));

// PATCH /lor/requests/:id — prof approve / reject / submit (status field se differentiate)
router.patch("/requests/:requestId", protect, authorize("professor", "admin", "hod"),
  ...upload("lorFile", "registrar/lor-files"),
  asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { status, professorRemarks, remarks: remarksField } = req.body;
    const remarks = professorRemarks || remarksField || null;

    let data;
    if (status === "Approved") {
      data = await svc.approveLorRequest(requestId, remarks);
    } else if (status === "Rejected") {
      data = await svc.rejectLorRequest(requestId, remarks);
    } else if (status === "Submitted") {
      data = await svc.submitLor(requestId, remarks, req.file || null);
    } else {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }
    res.json({ success: true, data });
  })
);

// POST /lor/requests/:id/meeting — schedule meeting
router.post("/requests/:requestId/meeting", protect, asyncHandler(async (req, res) => {
  const data = await svc.scheduleLorMeeting(
    req.params.requestId, req.user.id, req.body.meetingTime || req.body.requestedTime
  );
  res.json({ success: true, data });
}));

export default router;