import { InterviewSession } from "../db/index.js";
import { v4 as uuidv4 } from "uuid";

export const startGuestInterview = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      domain,
      role,
      experienceLevel,
      salaryRange,
    } = req.body;

    // Validate required fields (resume NOT required)
    if (!firstName || !email || !domain || !role) {
      return res.status(400).json({
        message: "Missing required fields: firstName, email, domain, role",
      });
    }

    // Check eligibility
    if (hasCompletedFreeInterview(email)) {
      return res.status(403).json({
        success: false,
        message:
          "You've already used your free interview. Please purchase a plan to continue.",
        needsUpgrade: true,
      });
    }

    // Resume is OPTIONAL
    let resumeUrl = null;
    let resumeData = null;

    if (req.file) {
      try {
        const text = await parseResume(req.file.buffer);
        resumeData = extractResumeInfo(text);
        // Resume URL would come from Cloudinary if needed
      } catch (parseErr) {
        console.log("Resume parsing optional, continuing without it");
      }
    }

    const sessionId = uuidv4();

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        guestName: `${firstName} ${lastName || ""}`,
        guestEmail: email,
        isGuest: true,
        isFreeInterview: true,
        profile: {
          firstName,
          lastName,
          email,
          domain,
          role,
          experienceLevel,
          salaryRange,
          resumeUrl: resumeUrl || null,
          resumeData: resumeData || null,
        },
      },
    });
  } catch (error) {
    console.error("Guest interview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start guest interview",
      error: error.message,
    });
  }
};