import { InterviewSession, User } from "../db/index.js";
import { generateQuestion, evaluateAnswer, synthesizeFinalReport } from "../services/gemini.service.js";
import { analyzeInterview } from "../services/analysis.service.js";
import { sendInterviewCompletionEmail, sendTranscriptionEmail } from "../services/email.service.js";
import { parseResume } from "../services/resumeParser.js";

export const startInterview = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.accountType === "guest" && user.usedGuestInterview)
      return res.status(403).json({ message: "Guest interview already used. Please register for full access." });

    const profile = user.interviewProfile || {};
    if (!profile.domain || !profile.experienceLevel)
      return res.status(400).json({ message: "Please complete your interview profile (domain + experience level) first." });

    // Resume required for non-guest users
    if (user.accountType !== "guest" && !user.resumeURL)
      return res.status(400).json({ message: "Please upload your resume before starting an interview." });

    // Resume open active session
    const active = await InterviewSession.findOne({
      where: { userId: user.id, completed: false },
    });
    if (active) {
      const q = active.questions[active.currentQuestionIndex];
      return res.json({ sessionId: active.id, question: q?.questionText || null, resumed: true });
    }

    // Parse resume text for contextual questions
    let resumeText = null;
    if (user.resumeURL) {
      try { resumeText = await parseResume(user.resumeURL); } catch (_) {}
    }

    // Generate 5 opening questions in parallel for speed
    const questionPromises = Array.from({ length: 5 }, (_, i) =>
      generateQuestion({
        domain: profile.domain,
        role: profile.role || user.role || null,
        experienceLevel: profile.experienceLevel,
        salaryRange: profile.salaryRange,
        language: profile.language || "en",
        resumeText,
        skills: user.skills || null,
      }).catch(() => `Tell me about your experience with ${profile.domain} (Q${i + 1})`)
    );
    const generated = await Promise.all(questionPromises);
    const questions = generated.map((q) => ({ questionText: q }));

    const session = await InterviewSession.create({
      userId: user.id,
      domain: profile.domain,
      language: profile.language || "en",
      salaryRange: profile.salaryRange || {},
      questions,
      currentQuestionIndex: 0,
    });

    return res.json({ sessionId: session.id, question: questions[0].questionText });
  } catch (err) {
    console.error("startInterview error:", err);
    res.status(500).json({ message: "Failed to start interview", error: err.message });
  }
};

export const submitAnswer = async (req, res) => {
  const { sessionId, answerText, confidence } = req.body;

  if (!sessionId || !answerText)
    return res.status(400).json({ message: "sessionId and answerText are required" });

  try {
    const session = await InterviewSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.userId !== req.user.id) return res.status(403).json({ message: "Access denied" });
    if (session.completed) return res.status(400).json({ message: "Interview already completed" });

    const idx = session.currentQuestionIndex;
    const questions = [...session.questions];

    // Save answer + confidence signals
    questions[idx] = {
      ...questions[idx],
      answerText,
      answeredAt: new Date().toISOString(),
      confidenceSignals: confidence
        ? { voice: confidence.voice ?? null, facial: confidence.facial ?? null }
        : null,
    };

    // AI evaluation for this answer
    const evaluation = await evaluateAnswer({
      question: questions[idx].questionText,
      answer: answerText,
      domain: session.domain,
      language: session.language,
      salaryRange: session.salaryRange,
      confidenceSignals: questions[idx].confidenceSignals,
    });
    questions[idx].evaluation = evaluation;

    // Generate follow-up if score is strong and we're not near the limit
    const shouldFollowUp = evaluation.overallScore >= 7 && questions.length < 20;
    if (shouldFollowUp) {
      const user = await User.findByPk(req.user.id);
      try {
        const followUp = await generateQuestion({
          domain: session.domain,
          experienceLevel: user?.interviewProfile?.experienceLevel,
          salaryRange: session.salaryRange,
          previousAnswer: answerText,
          language: session.language,
        });
        questions.push({ questionText: followUp, topic: "follow-up" });
      } catch (_) {}
    }

    const nextIndex = idx + 1;
    const isComplete = nextIndex >= questions.length || questions.length >= 25;

    let finalReport = session.finalReport || {};

    if (isComplete) {
      // Use rich analysis service for final report
      const synthesis = await analyzeInterview({
        questions,
        domain: session.domain,
        role: user?.interviewProfile?.role || user?.role || null,
        experienceLevel: user?.interviewProfile?.experienceLevel || null,
        salaryRange: session.salaryRange,
      });

      // Progress comparison
      const previousSessions = await InterviewSession.findAll({
        where: { userId: session.userId, completed: true },
        order: [["createdAt", "DESC"]],
        limit: 1,
      });
      let progressInsight = null;
      if (previousSessions.length > 0) {
        const prev = previousSessions[0].finalReport?.scores?.overall;
        if (prev) {
          const diff = synthesis.scores.overall - prev;
          if (diff > 0.5) progressInsight = `Improved by ${diff.toFixed(1)} points since your last interview. Keep it up!`;
          else if (diff < -0.5) progressInsight = `Score dropped by ${Math.abs(diff).toFixed(1)} points. Review the feedback from last time.`;
          else progressInsight = "Consistent performance with your previous interview.";
        }
      }

      finalReport = { ...synthesis, progressInsight, completedAt: new Date().toISOString() };

      // Send completion email (non-blocking)
      const user = await User.findByPk(session.userId);
      if (user) {
        sendInterviewCompletionEmail({
          to: user.email,
          name: user.firstName,
          sessionId: session.id,
          performanceCategory: synthesis.confidenceLevel,
        }).catch(console.error);

        // Send full transcription + report email (WisprFlow-style)
        sendTranscriptionEmail({
          to: user.email,
          name: user.firstName,
          sessionId: session.id,
          transcript: questions,
          report: finalReport,
        }).catch(console.error);

        if (user.accountType === "guest") {
          await user.update({ usedGuestInterview: true });
        }
      }
    }

    await session.update({
      questions,
      currentQuestionIndex: isComplete ? nextIndex : nextIndex,
      completed: isComplete,
      transcriptLocked: isComplete,
      finalReport: isComplete ? finalReport : session.finalReport,
      expiresAt: isComplete ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
    });

    return res.json({
      completed: isComplete,
      nextQuestion: isComplete ? null : questions[nextIndex]?.questionText,
      evaluation,
      finalReport: isComplete ? finalReport : null,
    });
  } catch (err) {
    console.error("submitAnswer error:", err);
    res.status(500).json({ message: "Failed to submit answer", error: err.message });
  }
};