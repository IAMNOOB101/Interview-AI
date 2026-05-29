import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get user profile
router.get("/profile", getUserProfile);

// Update user profile
router.put("/profile", updateUserProfile);

// Delete account
router.delete("/profile", deleteUserAccount);

export default router;