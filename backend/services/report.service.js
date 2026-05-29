import { createWriteStream, unlinkSync } from "fs";
import { join } from "path";
import PDFDocument from "pdfkit";
import { sendEmailWithAttachment } from "./email.service.js";

export const generateReport = ({ user, session }) =>
  new Promise((resolve, reject) => {
    const filename = `InterviewAI_Report_${user.id}_${Date.now()}.pdf`;
    const filepath = join("/tmp", filename);
    const doc = new PDFDocument({ margin: 50 });
    const stream = createWriteStream(filepath);
    doc.pipe(stream);

    const report = session.finalReport || {};
    const scores = report.scores   || {};

    // ── Header ──────────────────────────────────────────────────────
    doc.fontSize(20).font("Helvetica-Bold").text("InterviewAI — Interview Report", { align: "center" });
    doc.moveDown(0.4);
    doc.fontSize(10).font("Helvetica").fillColor("#64748b")
       .text(`Generated: ${new Date().toLocaleString()}  |  Domain: ${session.domain || "N/A"}`, { align: "center" });
    doc.fillColor("#000").moveDown(1);

    // ── Candidate ───────────────────────────────────────────────────
    doc.fontSize(13).font("Helvetica-Bold").text("Candidate");
    doc.fontSize(11).font("Helvetica")
       .text(`Name:  ${user.firstName || ""} ${user.lastName || ""}`)
       .text(`Email: ${user.email || "N/A"}`);
    if (user.role)        doc.text(`Role:  ${user.role}`);
    if (user.experience)  doc.text(`Level: ${user.experience}`);
    if (user.desiredSalary) doc.text(`Expected Salary: ${user.desiredSalary}`);
    doc.moveDown(1);

    // ── Scores ──────────────────────────────────────────────────────
    doc.fontSize(13).font("Helvetica-Bold").text("Scores");
    doc.fontSize(11).font("Helvetica")
       .text(`Overall:    ${scores.overall    ?? "N/A"} / 10`)
       .text(`Content:    ${scores.content    ?? "N/A"} / 10`)
       .text(`Clarity:    ${scores.clarity    ?? "N/A"} / 10`)
       .text(`Confidence: ${scores.confidence ?? "N/A"} / 10`)
       .text(`Level:      ${report.confidenceLevel || "N/A"}`);
    doc.moveDown(1);

    // ── Summary ─────────────────────────────────────────────────────
    if (report.summary) {
      doc.fontSize(13).font("Helvetica-Bold").text("Summary");
      doc.fontSize(11).font("Helvetica").text(report.summary, { lineGap: 4 });
      doc.moveDown(1);
    }

    // ── Key Insight ─────────────────────────────────────────────────
    if (report.keyInsight) {
      doc.fontSize(13).font("Helvetica-Bold").text("Key Insight");
      doc.fontSize(11).font("Helvetica").text(`💡 ${report.keyInsight}`, { lineGap: 4 });
      doc.moveDown(1);
    }

    // ── Strengths ───────────────────────────────────────────────────
    if (report.topStrengths?.length) {
      doc.fontSize(13).font("Helvetica-Bold").text("Strengths");
      report.topStrengths.forEach((s) => doc.fontSize(11).font("Helvetica").text(`• ${s}`));
      doc.moveDown(1);
    }

    // ── Areas for Improvement ───────────────────────────────────────
    if (report.topImprovements?.length) {
      doc.fontSize(13).font("Helvetica-Bold").text("Areas for Improvement");
      report.topImprovements.forEach((s) => doc.fontSize(11).font("Helvetica").text(`• ${s}`));
      doc.moveDown(1);
    }

    // ── Recommendations ─────────────────────────────────────────────
    if (report.recommendations?.length) {
      doc.fontSize(13).font("Helvetica-Bold").text("Recommendations");
      report.recommendations.forEach((r) => doc.fontSize(11).font("Helvetica").text(`→ ${r}`));
      doc.moveDown(1);
    }

    // ── Salary Readiness ────────────────────────────────────────────
    if (report.salaryReadiness) {
      doc.fontSize(13).font("Helvetica-Bold").text("Salary Readiness");
      doc.fontSize(11).font("Helvetica").text(report.salaryReadiness, { lineGap: 4 });
      doc.moveDown(1);
    }

    // ── Progress Insight ────────────────────────────────────────────
    if (report.progressInsight) {
      doc.fontSize(13).font("Helvetica-Bold").text("Progress");
      doc.fontSize(11).font("Helvetica").text(report.progressInsight, { lineGap: 4 });
      doc.moveDown(1);
    }

    // ── Full Transcript ─────────────────────────────────────────────
    const answered = (session.questions || []).filter((q) => q.answerText);
    if (answered.length) {
      doc.addPage();
      doc.fontSize(16).font("Helvetica-Bold").text("Full Interview Transcript (WisprFlow)");
      doc.moveDown(0.5);
      answered.forEach((q, i) => {
        doc.fontSize(12).font("Helvetica-Bold").fillColor("#1e293b").text(`Q${i + 1}: ${q.questionText}`);
        doc.fontSize(11).font("Helvetica").fillColor("#334155").text(`A: ${q.answerText}`, { lineGap: 3 });
        if (q.evaluation) {
          const e = q.evaluation;
          doc.fontSize(10).fillColor("#64748b")
             .text(`Score: ${e.overallScore}/10  |  Content: ${e.contentScore}  |  Clarity: ${e.clarityScore}  |  Confidence: ${e.confidenceScore}`)
             .text(`Strengths:    ${(e.strengths    || []).join("; ")}`)
             .text(`Improvements: ${(e.improvements || []).join("; ")}`);
          doc.fillColor("#000");
        }
        doc.moveDown(0.8);
      });
    }

    doc.end();
    stream.on("finish", () => resolve(filepath));
    stream.on("error", reject);
  });

export const handleReportAndEmail = async (user, session) => {
  const pdfPath = await generateReport({ user, session });
  await sendEmailWithAttachment(user.email, pdfPath);
  try { unlinkSync(pdfPath); } catch (_) {}
};
