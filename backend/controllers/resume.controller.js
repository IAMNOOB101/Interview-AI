import { User } from "../db/index.js";
import { uploadPDFToCloudinary } from "../services/cloudinary.service.js";
import { parseResume, extractResumeInfo } from "../services/resumeParser.js";

export const uploadResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const { resumeURL, resumeText } = req.body;
    let file = req.file;

    if (!resumeURL && !resumeText && !file)
      return res.status(400).json({ message: "resumeURL, file, or resumeText is required" });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let newResumeURL = resumeURL || user.resumeURL;
    let resumeData = {};

    // Handle file upload
    if (file) {
      // Validate PDF file
      if (file.mimetype !== "application/pdf") {
        return res.status(400).json({ message: "Only PDF files are allowed" });
      }

      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: "File size must be less than 5MB" });
      }

      // Upload to Cloudinary
      const fileName = `${userId}_${Date.now()}`;
      const result = await uploadPDFToCloudinary(file.buffer, fileName);
      newResumeURL = result.secure_url;

      // Parse PDF and extract information
      try {
        const extractedText = await parseResume(newResumeURL);
        resumeData = extractResumeInfo(extractedText);
      } catch (parseErr) {
        console.error("Resume parsing error:", parseErr);
        // Continue even if parsing fails
      }
    }

    await user.update({
      resumeURL: newResumeURL,
      resumeData: Object.keys(resumeData).length > 0 ? resumeData : user.resumeData
    });

    res.json({
      message: "Resume uploaded successfully",
      resumeURL: newResumeURL,
      extractedInfo: resumeData
    });
  } catch (err) {
    console.error("Resume upload error:", err);
    res.status(500).json({ message: "Resume upload failed", error: err.message });
  }
};

export const getResume = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ["resumeURL", "resumeData"] });
    if (!user || !user.resumeURL)
      return res.status(404).json({ message: "Resume not found" });

    res.json({
      resumeURL: user.resumeURL,
      resumeData: user.resumeData
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to get resume", error: err.message });
  }
};
