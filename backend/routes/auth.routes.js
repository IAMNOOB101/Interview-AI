import express from "express";
import multer from "multer";
import { register, login, guestLogin, getMe, initTotp, confirmTotp, disableTotp } from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post("/register", upload.single("resume"), register);
router.post("/login",    login);
router.post("/guest",    guestLogin);
router.get("/me",        verifyToken, getMe);
router.post("/logout",   (req, res) => { res.clearCookie("token"); res.json({ message: "Logged out" }); });

// TOTP 2FA
router.post("/totp/init",    verifyToken, initTotp);
router.post("/totp/confirm", verifyToken, confirmTotp);
router.post("/totp/disable", verifyToken, disableTotp);

export default router;
