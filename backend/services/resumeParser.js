import pdfParse from "pdf-parse";

// Parse resume from a Cloudinary/remote URL
export const parseResume = async (resumeURL) => {
  const res = await fetch(resumeURL);
  const buffer = await res.arrayBuffer();
  const parsed = await pdfParse(Buffer.from(buffer));
  return parsed.text;
};

// Parse resume from a raw Buffer (for signup pre-fill — no Cloudinary)
export const parseResumeFromBuffer = async (buffer) => {
  const parsed = await pdfParse(buffer);
  return parsed.text;
};

// Extract structured fields from raw resume text
export const extractResumeInfo = (resumeText) => {
  if (!resumeText || typeof resumeText !== "string") return {};

  const text = resumeText;

  // ── Email ──
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  const email = emailMatch ? emailMatch[0] : null;

  // ── Name (first line heuristic) ──
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let firstName = null, lastName = null;
  const nameLine = lines[0];
  if (nameLine && !nameLine.includes("@") && nameLine.length < 60) {
    const parts = nameLine.split(/\s+/);
    firstName = parts[0] || null;
    lastName = parts.slice(1).join(" ") || null;
  }

  // ── Skills ──
  const skillsSection = extractSection(text, ["skills", "technical skills", "core competencies", "technologies"]);
  const skills = parseSkills(skillsSection);

  // ── Experience level ──
  const expYears = extractExperienceYears(text);
  let experience = "Fresher";
  if (expYears >= 6) experience = "Senior";
  else if (expYears >= 3) experience = "Mid";
  else if (expYears >= 1) experience = "Junior";

  // ── Education ──
  const educationSection = extractSection(text, ["education", "qualifications", "academic"]);
  const education = educationSection.split("\n").slice(0, 4).join(" ").trim();

  // ── Domain / Role heuristics ──
  const domain = extractDomain(text);
  const role = extractRole(lines);

  return { email, firstName, lastName, skills, experience, education, domain, role };
};

// ── Helpers ──────────────────────────────────────────────────────────────

const extractSection = (text, keywords) => {
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    const idx = lower.indexOf(kw);
    if (idx !== -1) return text.substring(idx, Math.min(idx + 1000, text.length));
  }
  return "";
};

const parseSkills = (section) => {
  if (!section) return [];
  // Pull out comma/pipe/bullet separated tokens
  return section
    .replace(/skills?:?/i, "")
    .split(/[,|•\n\t]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 40 && !/^\d+$/.test(s))
    .slice(0, 20);
};

const extractExperienceYears = (text) => {
  const matches = text.match(/(\d+)\+?\s*(?:year|yr)/gi) || [];
  const nums = matches.map((m) => parseInt(m));
  return nums.length ? Math.max(...nums) : 0;
};

const DOMAINS = [
  "software engineering", "frontend", "backend", "full stack", "data science",
  "machine learning", "devops", "cloud", "mobile", "android", "ios",
  "cybersecurity", "embedded", "data analytics", "product management",
];
const extractDomain = (text) => {
  const lower = text.toLowerCase();
  const match = DOMAINS.find((d) => lower.includes(d));
  if (!match) return "";
  return match.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
};

const ROLE_KEYWORDS = [
  "software engineer", "frontend developer", "backend developer", "full stack developer",
  "data scientist", "ml engineer", "devops engineer", "cloud engineer",
  "product manager", "ui/ux designer", "android developer", "ios developer",
];
const extractRole = (lines) => {
  const text = lines.slice(0, 5).join(" ").toLowerCase();
  const match = ROLE_KEYWORDS.find((r) => text.includes(r));
  if (!match) return "";
  return match.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
};
