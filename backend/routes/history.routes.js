import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { getInterviewHistory } from "../controllers/history.controller.js";

const router = express.Router();
router.get("/history", verifyToken, getInterviewHistory);
export default router;
