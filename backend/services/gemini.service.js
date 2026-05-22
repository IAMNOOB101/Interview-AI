import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ── Helpers ────────────────────────────────────────────────────────────────

const safeJSON = (text) => {
  // Strip markdown code fences Gemini sometimes adds
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};

// ── Question generation ────────────────────────────────────────────────────

export const generateQuestion = async ({
  domain,
  experienceLevel,
  salaryRange,
  language = "en",
  previousAnswer = null,
  resumeText = null,
}) => {
  const prompt = `You are a professional interview question generator.

Role/Domain: ${domain}
Experience level: ${experienceLevel}
Salary range: ${salaryRange?.min || "N/A"} – ${salaryRange?.max || "N/A"} LPA
Language: ${language}
${previousAnswer ? `\nPrevious candidate answer: "${previousAnswer}"\nGenerate a relevant follow-up question.` : ""}
${resumeText ? `\nCandidate resume context:\n${resumeText.slice(0, 1500)}` : ""}

Generate ONE concise, specific interview question. Return only the question text, no preamble.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error("Gemini question generation failed:", err.message);
    throw err;
  }
};

// ── Answer evaluation ──────────────────────────────────────────────────────

export const evaluateAnswer = async ({
  question,
  answer,
  domain,
  language,
  salaryRange,
  confidenceSignals,
}) => {
  const prompt = `You are an expert technical interview evaluator.

Domain: ${domain}
Question: "${question}"
Candidate answer: "${answer}"
${confidenceSignals ? `Voice confidence signal (0-10): ${confidenceSignals.voice ?? "N/A"}
Facial confidence signal (0-10): ${confidenceSignals.facial ?? "N/A"}` : ""}

Evaluate strictly on these criteria:
1. Technical correctness and depth
2. Clarity and structure of explanation
3. Relevance to the question
4. Confidence (use signals if provided, otherwise infer from answer quality)

Return ONLY valid JSON (no markdown):
{
  "contentScore": <number 1-10>,
  "clarityScore": <number 1-10>,
  "confidenceScore": <number 1-10>,
  "overallScore": <number 1-10>,
  "strengths": [<string>, <string>],
  "improvements": [<string>, <string>]
}`;

  try {
    const result = await model.generateContent(prompt);
    return safeJSON(result.response.text());
  } catch (err) {
    console.error("Gemini evaluation failed, using fallback:", err.message);
    return {
      contentScore: 5,
      clarityScore: 5,
      confidenceScore: confidenceSignals?.voice ?? 5,
      overallScore: 5,
      strengths: ["Answer submitted"],
      improvements: ["AI evaluation temporarily unavailable"],
    };
  }
};

// ── Final report synthesis ─────────────────────────────────────────────────

export const synthesizeFinalReport = async ({ questions, domain }) => {
  const answeredQs = questions.filter((q) => q.answerText && q.evaluation);

  // Aggregate raw scores
  const scores = answeredQs.map((q) => q.evaluation);
  const avg = (key) =>
    scores.reduce((s, e) => s + (e[key] || 0), 0) / (scores.length || 1);

  const avgContent = avg("contentScore");
  const avgClarity = avg("clarityScore");
  const avgConfidence = avg("confidenceScore");
  const avgOverall = avg("overallScore");

  // Collect all strengths and improvements across answers
  const allStrengths = scores.flatMap((e) => e.strengths || []);
  const allImprovements = scores.flatMap((e) => e.improvements || []);

  // Ask Gemini to synthesise a coherent summary
  const prompt = `You are a career coach summarising a mock interview performance.

Domain: ${domain}
Average scores — Content: ${avgContent.toFixed(1)}/10, Clarity: ${avgClarity.toFixed(1)}/10, Confidence: ${avgConfidence.toFixed(1)}/10, Overall: ${avgOverall.toFixed(1)}/10

Raw strengths observed across all answers:
${allStrengths.slice(0, 10).join("\n")}

Raw improvement areas observed:
${allImprovements.slice(0, 10).join("\n")}

Return ONLY valid JSON (no markdown):
{
  "summary": "<2-3 sentence overall assessment>",
  "topStrengths": [<3 distinct, specific strength strings>],
  "topImprovements": [<3 distinct, specific improvement strings>],
  "confidenceLevel": "<Low|Medium|High>"
}`;

  try {
    const result = await model.generateContent(prompt);
    const synthesis = safeJSON(result.response.text());
    return {
      ...synthesis,
      scores: {
        content: parseFloat(avgContent.toFixed(2)),
        clarity: parseFloat(avgClarity.toFixed(2)),
        confidence: parseFloat(avgConfidence.toFixed(2)),
        overall: parseFloat(avgOverall.toFixed(2)),
      },
    };
  } catch (err) {
    console.error("Gemini synthesis failed, using aggregated fallback:", err.message);
    const level = avgOverall >= 7 ? "High" : avgOverall >= 5 ? "Medium" : "Low";
    return {
      summary: `Completed ${answeredQs.length} questions in ${domain}.`,
      topStrengths: [...new Set(allStrengths)].slice(0, 3),
      topImprovements: [...new Set(allImprovements)].slice(0, 3),
      confidenceLevel: level,
      scores: {
        content: parseFloat(avgContent.toFixed(2)),
        clarity: parseFloat(avgClarity.toFixed(2)),
        confidence: parseFloat(avgConfidence.toFixed(2)),
        overall: parseFloat(avgOverall.toFixed(2)),
      },
    };
  }
};