import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, Institution } from "../db/index.js";
import { sendVerificationEmail } from "../services/email.service.js";
import { generateTotpSecret, verifyTotpToken } from "../services/totp.service.js";
import { uploadPDFToCloudinary } from "../services/cloudinary.service.js";
import { parseResume, extractResumeInfo } from "../services/resumeParser.js";

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" });

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, accountType } = req.body;

    // Validate required fields (resume is OPTIONAL)
    if (!firstName || !email || !password) {
      return res.status(400).json({
        message: "Missing required fields: firstName, email, password",
      });
    }

    // Check if email exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Handle resume upload (OPTIONAL - may fail or not be provided)
    let resumeUrl = null;
    let resumeData = null;

    if (req.file) {
      try {
        // Try to upload resume, but don't fail registration if it fails
        const uploadResult = await cloudinary.uploader.upload_stream(
          { resource_type: "raw", folder: "resumes" },
          async (error, result) => {
            if (!error && result) {
              resumeUrl = result.secure_url;
            }
          }
        );
        uploadResult.end(req.file.buffer);

        // Parse resume if uploaded successfully
        if (resumeUrl) {
          try {
            const text = await parseResume(req.file.buffer);
            resumeData = extractResumeInfo(text);
          } catch (parseErr) {
            console.log("Resume parsing failed, continuing without it");
          }
        }
      } catch (uploadErr) {
        console.log("Resume upload failed, continuing without it");
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (resume is optional)
    const user = await User.create({
      firstName,
      lastName: lastName || "",
      email,
      password: hashedPassword,
      accountType: accountType || "professional",
      resumeUrl: resumeUrl || null,
      resumeData: resumeData || {},
    });

    // Generate JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  const { email, password, totpToken } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    if (user.totpEnabled) {
      if (!totpToken)
        return res.status(200).json({ totpRequired: true, message: "Enter your authenticator code" });
      const valid = verifyTotpToken(user.totpSecret, totpToken);
      if (!valid) return res.status(401).json({ message: "Invalid authenticator code" });
    }

    const token = signToken({ id: user.id, accountType: user.accountType });
    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 });
    res.status(200).json({
      token,
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName,
               email: user.email, accountType: user.accountType, totpEnabled: user.totpEnabled },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

export const guestLogin = async (req, res) => {
  const token = signToken({ id: null, accountType: "guest" });
  res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 });
  res.status(200).json({ token });
};

export const initTotp = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.totpEnabled) return res.status(400).json({ message: "TOTP already enabled" });
    const { secret, qrCode } = await generateTotpSecret(user.email);
    await user.update({ totpSecret: secret });
    res.json({ qrCode, message: "Scan with Google Authenticator then confirm at /auth/totp/confirm" });
  } catch (err) {
    res.status(500).json({ message: "TOTP setup failed", error: err.message });
  }
};

export const confirmTotp = async (req, res) => {
  const { token: totpToken } = req.body;
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || !user.totpSecret)
      return res.status(400).json({ message: "Run /auth/totp/init first" });
    const valid = verifyTotpToken(user.totpSecret, totpToken);
    if (!valid) return res.status(401).json({ message: "Invalid code — try again" });
    await user.update({ totpEnabled: true });
    res.json({ message: "Two-factor authentication enabled" });
  } catch (err) {
    res.status(500).json({ message: "TOTP confirmation failed", error: err.message });
  }
};

export const disableTotp = async (req, res) => {
  const { password } = req.body;
  try {
    const user = await User.findByPk(req.user.id);
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Wrong password" });
    await user.update({ totpSecret: null, totpEnabled: false });
    res.json({ message: "Two-factor authentication disabled" });
  } catch (err) {
    res.status(500).json({ message: "Failed to disable TOTP", error: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    if (req.user.accountType === "guest") {
      return res.json({ user: { id: null, accountType: "guest", firstName: "Guest", lastName: "User" } });
    }
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password", "totpSecret"] },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
};