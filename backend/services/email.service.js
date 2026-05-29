import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "test@test.com",
    pass: process.env.EMAIL_PASS || "dummy_pass",
  },
});

export const sendInterviewCompletionEmail = async ({
  to,
  name,
  sessionId,
  performanceCategory
}) => {
  try {
    if (!process.env.EMAIL_USER) return console.log("Simulating Interview Completion Email to", to);
    await transporter.sendMail({
      from: `"InterviewAI" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your InterviewAI interview is complete 🎉",
      html: `
        <p>Hi ${name || "there"},</p>
        <p>Your interview has been successfully completed.</p>
        <p><strong>Overall Performance:</strong> ${performanceCategory}</p>
        <p>You can view your transcript and insights anytime:</p>
        <p>
          <a href="${process.env.CLIENT_URL}/history/${sessionId}">
            View Interview Transcript
          </a>
        </p>
        <br/>
        <p>– Team InterviewAI</p>
      `
    });
  } catch(e) { console.error("Email failed:", e.message) }
};

export const sendVerificationEmail = async (email, otp) => {
  try {
    if (!process.env.EMAIL_USER) return console.log("Simulating Verification Email to", email, "OTP:", otp);
    await transporter.sendMail({
      from: `InterviewAI <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your institutional email",
      text: `Your verification code is: ${otp}`,
    });
  } catch(e) { console.error("Email failed:", e.message) }
};

export const sendEmailWithAttachment = async (email, filePath) => {
  await transporter.sendMail({
    from: `InterviewAI <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Interview Report",
    text: "Your full report is attached.",
    attachments: [{ filename: "Interview_Report.pdf", path: filePath }],
  });
};

/**
 * Send interview transcription email to the user.
 * Includes the full Q&A transcript plus the final report summary.
 */
export const sendTranscriptionEmail = async ({ to, name, sessionId, transcript, report }) => {
  try {
    if (!process.env.EMAIL_USER) {
      console.log("Simulating Transcription Email to", to);
      return;
    }

    const transcriptHtml = (transcript || [])
      .filter((q) => q.answerText)
      .map((q, i) => `
        <div style="margin-bottom:1.5rem;padding:1rem;border-left:3px solid #6366f1;background:#f8fafc;">
          <p style="font-weight:700;color:#1e293b;margin:0 0 0.5rem">Q${i + 1}: ${q.questionText}</p>
          <p style="color:#475569;margin:0 0 0.5rem">${q.answerText}</p>
          ${q.evaluation ? `<p style="font-size:0.85em;color:#64748b">Score: ${q.evaluation.overallScore}/10 — ${(q.evaluation.strengths || []).join(", ")}</p>` : ""}
        </div>
      `).join("");

    const scores = report?.scores || {};
    const strengths = (report?.topStrengths || []).map((s) => `<li>${s}</li>`).join("");
    const improvements = (report?.topImprovements || []).map((s) => `<li>${s}</li>`).join("");
    const recommendations = (report?.recommendations || []).map((s) => `<li>${s}</li>`).join("");

    await transporter.sendMail({
      from: `"InterviewAI" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Your InterviewAI Transcript & Report — Session ${sessionId}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:700px;margin:0 auto;color:#1e293b">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:2rem;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:1.8rem">🎯 InterviewAI</h1>
            <p style="color:rgba(255,255,255,0.85);margin:0.5rem 0 0">Interview Complete — Full Report & Transcript</p>
          </div>

          <div style="background:#fff;padding:2rem;border:1px solid #e2e8f0;border-top:none">
            <p>Hi <strong>${name || "there"}</strong>,</p>
            <p>Congratulations on completing your mock interview! Here's your full session report and transcription.</p>

            <h2 style="border-bottom:2px solid #6366f1;padding-bottom:0.5rem">📊 Performance Scores</h2>
            <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem">
              ${["overall","content","clarity","confidence"].map((k) => `
                <tr>
                  <td style="padding:0.5rem;border-bottom:1px solid #e2e8f0;text-transform:capitalize;font-weight:600">${k}</td>
                  <td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">${scores[k] ?? "—"} / 10</td>
                  <td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">
                    <div style="background:#e2e8f0;border-radius:999px;height:8px;width:150px">
                      <div style="background:#6366f1;height:100%;border-radius:999px;width:${((scores[k] || 0) / 10) * 100}%"></div>
                    </div>
                  </td>
                </tr>
              `).join("")}
            </table>

            ${report?.summary ? `<h2 style="border-bottom:2px solid #6366f1;padding-bottom:0.5rem">💡 Summary</h2><p>${report.summary}</p>` : ""}

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
              <div>
                <h3 style="color:#059669">✅ Strengths</h3>
                <ul style="padding-left:1.2rem;line-height:2">${strengths}</ul>
              </div>
              <div>
                <h3 style="color:#d97706">🚀 Areas to Improve</h3>
                <ul style="padding-left:1.2rem;line-height:2">${improvements}</ul>
              </div>
            </div>

            ${recommendations ? `<h3>📌 Recommendations</h3><ul style="padding-left:1.2rem;line-height:2">${recommendations}</ul>` : ""}
            ${report?.salaryReadiness ? `<p><strong>Salary Readiness:</strong> ${report.salaryReadiness}</p>` : ""}
            ${report?.keyInsight ? `<div style="background:#f0f9ff;border-left:4px solid #0ea5e9;padding:1rem;border-radius:0 8px 8px 0;margin:1rem 0"><strong>💡 Key Insight:</strong> ${report.keyInsight}</div>` : ""}

            <h2 style="border-bottom:2px solid #6366f1;padding-bottom:0.5rem;margin-top:2rem">📝 Full Transcript (WisprFlow)</h2>
            ${transcriptHtml || "<p>No transcript available.</p>"}

            <div style="text-align:center;margin-top:2rem">
              <a href="${process.env.CLIENT_URL}/report/${sessionId}"
                 style="background:#6366f1;color:#fff;padding:0.75rem 2rem;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
                View Online Report →
              </a>
            </div>
          </div>

          <div style="background:#f8fafc;padding:1rem;border-radius:0 0 12px 12px;text-align:center;color:#64748b;font-size:0.85rem">
            <p>InterviewAI · Your AI-Powered Interview Coach</p>
          </div>
        </div>
      `,
    });
  } catch (e) {
    console.error("Transcription email failed:", e.message);
  }
};
