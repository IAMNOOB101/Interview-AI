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
