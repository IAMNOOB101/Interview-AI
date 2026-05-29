import express from "express";
import multer from "multer";
import { uploadResume, getResume, parseResumePublic } from "../controllers/resume.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") cb(new Error("Only PDF files are allowed"));
    else cb(null, true);
  },
});

const router = express.Router();

// Public: parse PDF for signup form pre-fill (no auth required)
router.post("/parse", upload.single("resume"), parseResumePublic);

// Protected routes
router.use(verifyToken);
router.use(allowRoles("student", "professional", "admin"));

router.post("/upload", upload.single("resume"), uploadResume);
router.get("/", getResume);

export default router;
