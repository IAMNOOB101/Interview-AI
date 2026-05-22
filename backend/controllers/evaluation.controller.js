// Standalone evaluation endpoint (optional, most evaluation happens inside session.controller.js)
import { evaluateAnswer } from "../services/gemini.service.js";

export const evaluateInterviewAnswer = async (req, res) => {
  const { question, answer, domain, language } = req.body;
  if (!question || !answer)
    return res.status(400).json({ message: "question and answer are required" });

  try {
    const evaluation = await evaluateAnswer({ question, answer, domain: domain || "General", language: language || "en" });
    res.json({ evaluation });
  } catch (err) {
    res.status(500).json({ message: "Evaluation failed", error: err.message });
  }
};
