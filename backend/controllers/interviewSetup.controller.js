import { User } from "../db/index.js";

export const setupInterviewProfile = async (req, res) => {
  const { domain, experienceLevel, salaryRange, language, role } = req.body;
  if (!domain || !experienceLevel)
    return res.status(400).json({ message: "domain and experienceLevel are required" });

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.update({
      domain,
      role: role || user.role,
      experience: experienceLevel,
      interviewProfile: { domain, experienceLevel, salaryRange, language: language || "en", role },
    });

    res.json({ message: "Profile saved", profile: user.interviewProfile });
  } catch (err) {
    res.status(500).json({ message: "Failed to save profile", error: err.message });
  }
};
