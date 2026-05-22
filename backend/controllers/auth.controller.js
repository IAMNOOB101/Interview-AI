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
  const { firstName, lastName, email, password, accountType, enrollmentNumber } = req.body;
  if (!firstName || !email || !password || !accountType)
    return res.status(400).json({ message: "firstName, email, password and accountType are required" });

  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    let institutionId = null;
    if (accountType === "student") {
      const domain = email.split("@")[1];
      const institutions = await Institution.findAll({ where: { approvalStatus: "ACTIVE" } });
      const institution = institutions.find((i) => (i.allowedDomains || []).includes(domain));
      if (!institution)
        return res.status(403).json({ message: "Your institution email domain is not approved." });
      if (institution.studentsRegistered >= institution.studentLimit)
        return res.status(403).json({ message: "Institution student limit reached." });
      institutionId = institution.id;
      await institution.increment("studentsRegistered");
    }

    const { domain, role, experience, desiredSalary } = req.body;

    // Handle resume file if provided
    let resumeURL = null;
    let resumeData = {};

    if (req.file) {
      // Validate PDF file
      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({ message: "Only PDF files are allowed for resume" });
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: "Resume file size must be less than 5MB" });
      }

      try {
        // Upload to Cloudinary
        const fileName = `signup_${Date.now()}_${email.split("@")[0]}`;
        const result = await uploadPDFToCloudinary(req.file.buffer, fileName);
        resumeURL = result.secure_url;

        // Parse PDF and extract information
        try {
          const extractedText = await parseResume(resumeURL);
          resumeData = extractResumeInfo(extractedText);
        } catch (parseErr) {
          console.error("Resume parsing error:", parseErr);
          // Continue even if parsing fails
        }
      } catch (uploadErr) {
        console.error("Resume upload error:", uploadErr);
        return res.status(500).json({ message: "Failed to upload resume", error: uploadErr.message });
      }
    }

    const hashed = await bcrypt.hash(password, 12);
    await User.create({
      firstName, lastName, email, password: hashed,
      accountType, enrollmentNumber: enrollmentNumber || null,
      institutionId, institutionEmailVerified: false,
      domain, role, experience, desiredSalary,
      resumeURL,
      resumeData: Object.keys(resumeData).length > 0 ? resumeData : {},
      interviewProfile: { domain, role, experienceLevel: experience, salaryRange: desiredSalary }
    });

    sendVerificationEmail(email, firstName).catch(console.error);
    res.status(201).json({ message: "Account created. You can now log in." });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Registration failed", error: err.message });
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