import { User } from "../db/index.js";
import bcrypt from "bcryptjs";

/**
 * Get user profile
 */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: {
        exclude: ["password", "totpSecret"],
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      email,
      phone,
      domain,
      role,
      experience,
      skills,
      education,
      bio,
      desiredSalary,
    } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if new email is already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: "Email already in use" });
      }
    }

    // Update fields - use strict equality checks
    if (firstName !== undefined && firstName !== null) user.firstName = firstName;
    if (lastName !== undefined && lastName !== null) user.lastName = lastName;
    if (email !== undefined && email !== null) user.email = email;
    if (phone !== undefined && phone !== null) user.phone = phone;
    if (domain !== undefined && domain !== null) user.domain = domain;
    if (role !== undefined && role !== null) user.role = role;
    if (experience !== undefined && experience !== null) user.experience = experience;
    if (skills !== undefined && skills !== null) user.skills = skills;
    if (education !== undefined && education !== null) user.education = education;
    if (bio !== undefined && bio !== null) user.bio = bio;
    if (desiredSalary !== undefined && desiredSalary !== null) user.desiredSalary = desiredSalary;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete user account
 */
export const deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res
        .status(400)
        .json({ message: "Password required to delete account" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Delete user
    await user.destroy();

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: error.message });
  }
};