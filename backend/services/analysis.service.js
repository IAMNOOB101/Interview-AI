/**
 * Analyse a completed interview session and return a rich report object.
 * This is called by session.controller.js after the final answer is submitted.
 */
export const analyzeInterview = async ({ questions, domain, role, experienceLevel, salaryRange }) => {
  const answered = questions.filter((q) => q.answerText && q.evaluation);

  const scores = answered.map((q) => q.evaluation);
  const avg = (key) => scores.reduce((s, e) => s + (e[key] || 0), 0) / (scores.length || 1);

  const avgContent    = avg("contentScore");
  const avgClarity    = avg("clarityScore");
  const avgConfidence = avg("confidenceScore");
  const avgOverall    = avg("overallScore");

  const allStrengths    = scores.flatMap((e) => e.strengths    || []);
  const allImprovements = scores.flatMap((e) => e.improvements || []);

  // Build full transcript string for Gemini analysis
  const transcriptText = answered
    .map((q, i) => `Q${i + 1}: ${q.questionText}\nA: ${q.answerText}`)
    .join("\n\n");

  const prompt = `You are a senior career coach conducting a detailed post-interview analysis.

Role: ${role || domain}
Experience Level: ${experienceLevel || "Not specified"}
Salary Range: ${salaryRange?.min || "N/A"} – ${salaryRange?.max || "N/A"} LPA

Average Scores — Content: ${avgContent.toFixed(1)}/10, Clarity: ${avgClarity.toFixed(1)}/10, Confidence: ${avgConfidence.toFixed(1)}/10, Overall: ${avgOverall.toFixed(1)}/10

Full Interview Transcript:
${transcriptText.slice(0, 3000)}

Strengths observed: ${allStrengths.slice(0, 8).join("; ")}
Improvement areas: ${allImprovements.slice(0, 8).join("; ")}

Return ONLY valid JSON (no markdown):
{
  "summary": "<3-4 sentence comprehensive assessment>",
  "topStrengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "topImprovements": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"],
  "recommendations": ["<actionable recommendation 1>", "<actionable recommendation 2>", "<actionable recommendation 3>"],
  "confidenceLevel": "<Low|Medium|High>",
  "salaryReadiness": "<whether the candidate is ready for the expected salary range, 1-2 sentences>",
  "keyInsight": "<one most important insight for this candidate>"
}`;

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(text);

    return {
      ...analysis,
      scores: {
        content:    parseFloat(avgContent.toFixed(2)),
        clarity:    parseFloat(avgClarity.toFixed(2)),
        confidence: parseFloat(avgConfidence.toFixed(2)),
        overall:    parseFloat(avgOverall.toFixed(2)),
      },
    };
  } catch (err) {
    console.error("analyzeInterview Gemini failed:", err.message);
    const level = avgOverall >= 7 ? "High" : avgOverall >= 5 ? "Medium" : "Low";
    return {
      summary: `Completed ${answered.length} questions in ${domain}.`,
      topStrengths: [...new Set(allStrengths)].slice(0, 3),
      topImprovements: [...new Set(allImprovements)].slice(0, 3),
      recommendations: ["Review your answers and practice weak areas.", "Work on explaining concepts more clearly.", "Mock more interviews to build confidence."],
      confidenceLevel: level,
      salaryReadiness: "Assessment unavailable.",
      keyInsight: "Keep practicing and improving.",
      scores: {
        content:    parseFloat(avgContent.toFixed(2)),
        clarity:    parseFloat(avgClarity.toFixed(2)),
        confidence: parseFloat(avgConfidence.toFixed(2)),
        overall:    parseFloat(avgOverall.toFixed(2)),
      },
    };
  }
};
