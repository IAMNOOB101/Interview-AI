import { InterviewSession, User } from "../db/index.js";
import { generateReport } from "../services/report.service.js";
import { existsSync } from "fs";

export const downloadReport = async (req, res) => {
  try {
    const session = await InterviewSession.findByPk(Number(req.params.sessionId));
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.userId !== req.user.id) return res.status(403).json({ message: "Access denied" });
    if (!session.completed) return res.status(400).json({ message: "Interview not yet completed" });

    const user = await User.findByPk(req.user.id, { attributes: ["id","firstName","lastName","email"] });
    const filepath = await generateReport({ user, session });

    if (!existsSync(filepath)) return res.status(500).json({ message: "Report generation failed" });
    res.download(filepath, "InterviewAI_Report.pdf");
  } catch (err) {
    res.status(500).json({ message: "Download error", error: err.message });
  }
};
