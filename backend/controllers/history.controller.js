import { InterviewSession } from "../db/index.js";

export const getInterviewTranscript = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const id = Number(sessionId);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid interview ID" });

    const session = await InterviewSession.findByPk(id);
    if (!session) return res.status(404).json({ message: "Interview not found" });

    // Ownership check
    if (session.userId !== req.user.id && req.user.accountType !== "admin")
      return res.status(403).json({ message: "Access denied" });

    res.json({
      sessionId: session.id,
      startedAt: session.createdAt,
      completedAt: session.updatedAt,
      domain: session.domain,
      transcript: (session.questions || []).map((q) => ({
        question: q.questionText,
        answer: q.answerText || null,
        answeredAt: q.answeredAt || null,
        evaluation: q.evaluation || null,
      })),
      finalReport: session.finalReport,
    });
  } catch (err) {
    next(err);
  }
};

export const getInterviewHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessions = await InterviewSession.findAll({
      where: { userId, completed: true },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      count: sessions.length,
      sessions: sessions.map((s) => ({
        id: s.id,
        sessionId: s.id,
        date: s.createdAt,
        domain: s.domain,
        finalScore: s.finalReport?.scores?.overall ?? null,
        confidenceLevel: s.finalReport?.confidenceLevel ?? null,
        finalReport: s.finalReport,
        expiresAt: s.expiresAt ?? null,
      })),
    });
  } catch (err) {
    next(err);
  }
};
