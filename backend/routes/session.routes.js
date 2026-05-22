import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { startInterview, submitAnswer } from "../controllers/session.controller.js";
import { getInterviewHistory, getInterviewTranscript } from "../controllers/history.controller.js";

const router = express.Router();

// History (must come before /:sessionId to avoid conflict)
router.get("/sessions", verifyToken, getInterviewHistory);
router.get("/report/:sessionId", verifyToken, getInterviewTranscript);

// Session lifecycle
router.post("/session/start", verifyToken, startInterview);
router.post("/session/submit", verifyToken, submitAnswer);

export default router;
