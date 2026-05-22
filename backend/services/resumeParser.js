import pdfParse from "pdf-parse";

export const parseResume = async (resumeURL) => {
  const res = await fetch(resumeURL);
  const buffer = await res.arrayBuffer();
  const text = await pdfParse(Buffer.from(buffer));
  return text.text;
};

export const extractResumeInfo = (resumeText) => {
  if (!resumeText || typeof resumeText !== "string") {
    return null;
  }

  const lowerText = resumeText.toLowerCase();

  return {
    rawText: resumeText,
    skills: extractSection(resumeText, ["skills", "technical skills", "core competencies"]),
    experience: extractSection(resumeText, ["experience", "work experience", "professional experience"]),
    projects: extractSection(resumeText, ["projects", "key projects"]),
    education: extractSection(resumeText, ["education", "qualifications"]),
    certifications: extractSection(resumeText, ["certifications", "certificates", "achievements", "awards"])
  };
};

const extractSection = (text, keywords) => {
  const lowerText = text.toLowerCase();

  for (const keyword of keywords) {
    const index = lowerText.indexOf(keyword);
    if (index !== -1) {
      // Extract more context (up to 1000 chars after the keyword)
      return text.substring(index, Math.min(index + 1000, text.length));
    }
  }

  return "";
};

