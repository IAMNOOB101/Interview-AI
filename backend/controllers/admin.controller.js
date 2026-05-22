import { User, Institution, InterviewSession } from "../db/index.js";
import { Op } from "sequelize";

export const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalInterviews = await InterviewSession.count();
    const completedInterviews = await InterviewSession.count({ where: { completed: true } });

    const completedSessions = await InterviewSession.findAll({
      where: { completed: true },
      attributes: ["finalReport"],
    });

    const scores = completedSessions
      .map((s) => s.finalReport?.scores?.overall)
      .filter((v) => typeof v === "number");

    const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : "0.00";

    res.json({ users: totalUsers, interviews: totalInterviews, completedInterviews, averageScore: avgScore });
  } catch (err) {
    res.status(500).json({ message: "Failed to get stats", error: err.message });
  }
};

export const getDomainWiseStats = async (req, res) => {
  try {
    const sessions = await InterviewSession.findAll({ where: { completed: true }, attributes: ["domain", "finalReport"] });

    const map = {};
    for (const s of sessions) {
      const d = s.domain || "Unknown";
      if (!map[d]) map[d] = { domain: d, count: 0, total: 0 };
      map[d].count += 1;
      const score = s.finalReport?.scores?.overall;
      if (typeof score === "number") map[d].total += score;
    }

    const stats = Object.values(map).map((v) => ({
      domain: v.domain,
      count: v.count,
      avgScore: v.count ? (v.total / v.count).toFixed(2) : "0.00",
    }));

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Failed to get domain stats", error: err.message });
  }
};

export const createInstitution = async (req, res) => {
  try {
    const { name, allowedDomains, perStudentPrice, studentLimit } = req.body;
    if (!name || !allowedDomains || !studentLimit)
      return res.status(400).json({ message: "name, allowedDomains, and studentLimit are required" });

    const institution = await Institution.create({
      name,
      allowedDomains: Array.isArray(allowedDomains) ? allowedDomains : [allowedDomains],
      perStudentPrice: perStudentPrice || 0,
      studentLimit,
      approvalStatus: "PENDING",
    });

    res.status(201).json(institution);
  } catch (err) {
    res.status(500).json({ message: "Failed to create institution", error: err.message });
  }
};

export const updateInstitutionStatus = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { status } = req.body;
    if (!["ACTIVE", "REJECTED", "PENDING"].includes(status))
      return res.status(400).json({ message: "Invalid status. Must be ACTIVE, REJECTED, or PENDING." });

    const institution = await Institution.findByPk(institutionId);
    if (!institution) return res.status(404).json({ message: "Institution not found" });

    await institution.update({ approvalStatus: status });
    res.json(institution);
  } catch (err) {
    res.status(500).json({ message: "Failed to update institution status", error: err.message });
  }
};

export const listInstitutions = async (req, res) => {
  try {
    const institutions = await Institution.findAll({ order: [["createdAt", "DESC"]] });
    res.json(institutions);
  } catch (err) {
    res.status(500).json({ message: "Failed to list institutions", error: err.message });
  }
};