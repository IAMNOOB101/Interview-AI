import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { downloadReport } from "../controllers/interview.controller.js";
import { evaluateInterviewAnswer } from "../controllers/evaluation.controller.js";

const router = express.Router();
router.get("/download/:sessionId", verifyToken, downloadReport);
router.post("/evaluate", verifyToken, evaluateInterviewAnswer);
export default router;
