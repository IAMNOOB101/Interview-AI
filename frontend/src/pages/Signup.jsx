import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const STEPS = ["Account & Resume", "Profile"];

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    accountType: "professional",
    enrollmentNumber: "",
    domain: "",
    role: "",
    experience: "",
    desiredSalary: "",
  });
  const [resume, setResume] = useState(null);
  const [resumeError, setResumeError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

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

  const next = (e) => {
    e.preventDefault();
    setError("");
    if (!form.firstName || !form.email || !form.password || !form.accountType) {
      return setError("Please fill in all required fields");
    }
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Use FormData to support file upload
      const formData = new FormData();
      formData.append("firstName", form.firstName);
      formData.append("lastName", form.lastName);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("accountType", form.accountType);
      formData.append("enrollmentNumber", form.enrollmentNumber);
      formData.append("domain", form.domain);
      formData.append("role", form.role);
      formData.append("experience", form.experience);
      formData.append("desiredSalary", form.desiredSalary);

      if (resume) {
        formData.append("resume", resume);
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Registration failed");
      navigate("/login", { state: { message: "Account created! Please login." } });
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-header">
          <div className="auth-icon">🚀</div>
          <h1>Create Account</h1>
          <p>Step {step + 1} of {STEPS.length}: <strong>{STEPS[step]}</strong></p>
        </div>

        {/* Step indicator */}
        <div className="step-indicator">
          {STEPS.map((s, i) => (
            <div key={s} className={`step-dot ${i <= step ? "active" : ""}`} />
          ))}
        </div>

        {step === 0 && (
          <form onSubmit={next} className="auth-form">
            <div className="form-row-2">
              <div className="form-group">
                <label>First Name *</label>
                <input name="firstName" placeholder="John" onChange={handleChange} value={form.firstName} required />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input name="lastName" placeholder="Doe" onChange={handleChange} value={form.lastName} />
              </div>
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input name="email" type="email" placeholder="you@example.com" onChange={handleChange} value={form.email} required autoComplete="email" />
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input name="password" type="password" placeholder="Min. 8 characters" onChange={handleChange} value={form.password} required autoComplete="new-password" />
            </div>

            <div className="form-group">
              <label>Account Type *</label>
              <select name="accountType" onChange={handleChange} value={form.accountType}>
                <option value="professional">Professional</option>
                <option value="student">Student (Institution)</option>
              </select>
            </div>

            {form.accountType === "student" && (
              <div className="form-group">
                <label>Enrollment Number</label>
                <input name="enrollmentNumber" placeholder="EN2024001" onChange={handleChange} value={form.enrollmentNumber} />
                <span className="form-hint">Your institutional email must be from an approved domain</span>
              </div>
            )}

            <div className="form-group">
              <label>Upload Resume (Optional, PDF only)</label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeChange}
                  style={{ width: "100%" }}
                />
              </div>
              {resume && <p className="form-hint">✓ Selected: {resume.name}</p>}
              {resumeError && <div className="alert alert-error">{resumeError}</div>}
              <span className="form-hint">We'll extract your skills, experience, and education from your resume to help tailor your interview questions.</span>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button type="submit" className="btn-primary">Next →</button>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Target Domain *</label>
              <input name="domain" placeholder="e.g. Software Engineering" onChange={handleChange} value={form.domain} required />
            </div>

            <div className="form-group">
              <label>Desired Role *</label>
              <input name="role" placeholder="e.g. Backend Developer" onChange={handleChange} value={form.role} required />
            </div>

            <div className="form-group">
              <label>Experience Level *</label>
              <select name="experience" onChange={handleChange} value={form.experience} required>
                <option value="">Select level</option>
                <option value="Fresher">Fresher (0 yrs)</option>
                <option value="Junior">Junior (1–3 yrs)</option>
                <option value="Mid">Mid-level (3–6 yrs)</option>
                <option value="Senior">Senior (6+ yrs)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Expected Salary</label>
              <input name="desiredSalary" placeholder="e.g. 8 LPA" onChange={handleChange} value={form.desiredSalary} />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="btn-row">
              <button type="button" className="btn-ghost" onClick={() => setStep(0)}>← Back</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Creating…" : "Create Account"}
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
