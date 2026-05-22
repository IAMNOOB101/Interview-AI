import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { setupInterviewProfile } from "../controllers/interviewSetup.controller.js";

const router = express.Router();
router.post("/setup", verifyToken, setupInterviewProfile);
export default router;
