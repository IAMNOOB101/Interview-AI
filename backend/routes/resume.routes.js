import express from "express";
import multer from "multer";
import { uploadResume, getResume } from "../controllers/resume.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed"));
    } else {
      cb(null, true);
    }
  },
});

const router = express.Router();

router.use(verifyToken);
router.use(allowRoles("student", "professional", "admin"));

router.post("/upload", upload.single("resume"), uploadResume);
router.get("/", getResume);

export default router;
