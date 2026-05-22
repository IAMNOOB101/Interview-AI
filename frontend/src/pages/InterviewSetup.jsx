import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setupProfile } from "../services/interview.service.js";

const DOMAINS = [
  "Software Engineering", "Frontend Development", "Backend Development",
  "Full Stack Development", "Data Science", "Machine Learning",
  "DevOps / Cloud", "Product Management", "Data Analytics",
  "UI/UX Design", "Cybersecurity", "Embedded Systems", "Other",
];

export default function InterviewSetup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    domain: "Software Engineering",
    experienceLevel: "Fresher",
    salaryRange: { min: 3, max: 8 },
    language: "en",
    role: "",
  });
  const [resume, setResume] = useState(null);
  const [resumeError, setResumeError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setResume(null);
      setResumeError("");
      return;
    }

    // Validate PDF
    if (file.type !== "application/pdf") {
      setResumeError("Only PDF files are allowed");
      setResume(null);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setResumeError("File size must be less than 5MB");
      setResume(null);
      return;
    }

    setResume(file);
    setResumeError("");
  };

  const uploadResume = async () => {
    if (!resume) return;

    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("resume", resume);

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to upload resume");
      }

      setSuccess("Resume uploaded successfully!");
      setResume(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to upload resume");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await setupProfile(form);
      setSuccess("Profile saved! You can now start your interview.");
      setTimeout(() => navigate("/interview"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 600 }}>
      <h1 style={{ marginBottom: "0.25rem" }}>Interview Setup</h1>
      <p style={{ marginBottom: "2rem" }}>Configure your interview preferences and update your resume if needed.</p>

      <div className="card">
        <form onSubmit={submit}>
          <div className="form-group">
            <label>📄 Update Resume (Optional)</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                accept=".pdf"
                onChange={handleResumeChange}
                style={{ width: "100%" }}
              />
            </div>
            {resume && (
              <>
                <p className="form-hint">✓ Selected: {resume.name}</p>
                <button
                  type="button"
                  onClick={uploadResume}
                  className="btn-ghost"
                  style={{ marginTop: "0.5rem" }}
                  disabled={loading}
                >
                  {loading ? "Uploading…" : "Upload Resume"}
                </button>
              </>
            )}
            {resumeError && <div className="alert alert-error">{resumeError}</div>}
            <span className="form-hint">Upload an updated resume to tailor your interview questions based on your latest experience.</span>
          </div>

          <hr style={{ margin: "1.5rem 0", border: "none", borderTop: "1px solid var(--border)" }} />

          <div className="form-group">
            <label>Target Domain *</label>
            <select name="domain" value={form.domain} onChange={handle}>
              {DOMAINS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Specific Role</label>
            <input name="role" value={form.role} onChange={handle} placeholder="e.g. Senior Backend Engineer" />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Experience Level *</label>
              <select name="experienceLevel" value={form.experienceLevel} onChange={handle}>
                <option>Fresher</option>
                <option>Junior</option>
                <option>Mid</option>
                <option>Senior</option>
              </select>
            </div>

            <div className="form-group">
              <label>Language</label>
              <select name="language" value={form.language} onChange={handle}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Min Salary (LPA)</label>
              <input type="number" min={0} value={form.salaryRange.min}
                onChange={(e) => setForm({ ...form, salaryRange: { ...form.salaryRange, min: Number(e.target.value) } })} />
            </div>
            <div className="form-group">
              <label>Max Salary (LPA)</label>
              <input type="number" min={0} value={form.salaryRange.max}
                onChange={(e) => setForm({ ...form, salaryRange: { ...form.salaryRange, max: Number(e.target.value) } })} />
            </div>
          </div>

          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving…" : "Save & Continue →"}
          </button>
        </form>
      </div>
    </div>
  );
}
