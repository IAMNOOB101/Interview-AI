import express from "express";
import { createOrder, verifyWebhook } from "../controllers/payment.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/order", verifyToken, createOrder);
router.post("/webhook", express.raw({ type: "application/json" }), verifyWebhook);

export default router;
