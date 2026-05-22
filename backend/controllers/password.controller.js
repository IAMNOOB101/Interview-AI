import bcrypt from "bcryptjs";
import { User } from "../db/index.js";

export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword)
    return res.status(400).json({ message: "email and newPassword are required" });
  if (newPassword.length < 8)
    return res.status(400).json({ message: "Password must be at least 8 characters" });

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "No account with that email" });

    const hash = await bcrypt.hash(newPassword, 12);
    await user.update({ password: hash });
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Password reset failed", error: err.message });
  }
};
