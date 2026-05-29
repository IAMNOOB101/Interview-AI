import express from "express";
import { startGuestInterview } from "../controllers/guest.controller.js";

const router = express.Router();

// Guest interview endpoint - NO authentication required
router.post("/interview/start", startGuestInterview);

export default router;