import React, { useState } from "react";
import { Link } from "react-router-dom";

const PLANS = {
  professional: [
    {
      name: "Starter",
      price: { monthly: 0, annual: 0 },
      tag: "Free Forever",
      color: "#64748b",
      features: [
        "1 mock interview / month",
        "Basic Q&A transcript",
        "AI-generated questions",
        "Score breakdown",
        "Email report",
      ],
      cta: "Get Started Free",
      href: "/signup",
      highlight: false,
    },
    {
      name: "Pro",
      price: { monthly: 799, annual: 599 },
      tag: "Most Popular",
      color: "#6366f1",
      features: [
        "Unlimited mock interviews",
        "Resume-tailored questions",
        "Salary-calibrated difficulty",
        "Strengths & weaknesses analysis",
        "Recommendations & next steps",
        "Full transcript email (WisprFlow)",
        "2FA security (Authenticator)",
        "Interview history dashboard",
      ],
      cta: "Start Pro",
      href: "/signup?plan=pro",
      highlight: true,
    },
    {
      name: "Elite",
      price: { monthly: 1499, annual: 1199 },
      tag: "For Senior Roles",
      color: "#f59e0b",
      features: [
        "Everything in Pro",
        "Salary negotiation coaching",
        "System design interview mode",
        "HR & behavioural rounds",
        "Domain expert question packs",
        "Priority AI evaluation",
        "Resume improvement suggestions",
        "1-on-1 AI career advisor chat",
      ],
      cta: "Go Elite",
      href: "/signup?plan=elite",
      highlight: false,
    },
  ],
  student: [
    {
      name: "Campus Free",
      price: { monthly: 0, annual: 0 },
      tag: "Institution Provided",
      color: "#0ea5e9",
      features: [
        "5 mock interviews / month",
        "Basic transcript",
        "AI questions by domain",
        "Score report",
      ],
      cta: "Join via Institution",
      href: "/signup?type=student",
      highlight: false,
    },
    {
      name: "Campus Pro",
      price: { monthly: 299, annual: 199 },
      tag: "Best for Placements",
      color: "#8b5cf6",
      features: [
        "Unlimited interviews",
        "Resume tailoring",
        "Placement-ready question banks",
        "CGPA-aware difficulty",
        "Strengths & improvement report",
        "Full transcript to email",
        "2FA security",
        "Freshers / internship mode",
      ],
      cta: "Start Campus Pro",
      href: "/signup?plan=campus-pro&type=student",
      highlight: true,
    },
  ],
};

export default function Plans() {
  const [tab, setTab] = useState("professional");
  const [billing, setBilling] = useState("monthly");

  const plans = PLANS[tab];

  const formatPrice = (plan) => {
    const p = plan.price[billing];
    if (p === 0) return "Free";
    return `₹${p.toLocaleString("en-IN")} / mo`;
  };

  return (
    <div className="page-container">
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>Simple, Transparent Pricing</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.05rem" }}>
          Ace your next interview — choose the plan that fits your journey
        </p>

        {/* Type toggle */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", margin: "1.5rem 0 0.75rem" }}>
          {["professional", "student"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={tab === t ? "btn-primary" : "btn-ghost"}
              style={{ padding: "0.5rem 1.25rem", textTransform: "capitalize" }}
            >
              {t === "professional" ? "👔 Professional" : "🎓 Student"}
            </button>
          ))}
        </div>

        {/* Billing toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginTop: "0.75rem" }}>
          <span style={{ fontSize: "0.9rem", color: billing === "monthly" ? "var(--text)" : "var(--text-muted)" }}>Monthly</span>
          <button
            onClick={() => setBilling((b) => (b === "monthly" ? "annual" : "monthly"))}
            style={{
              width: 52, height: 28, borderRadius: 999, border: "none", cursor: "pointer",
              background: billing === "annual" ? "var(--primary)" : "var(--border)",
              position: "relative", transition: "background 0.2s",
            }}
          >
            <span style={{
              position: "absolute", top: 4, left: billing === "annual" ? 28 : 4,
              width: 20, height: 20, borderRadius: "50%", background: "#fff",
              transition: "left 0.2s",
            }} />
          </button>
          <span style={{ fontSize: "0.9rem", color: billing === "annual" ? "var(--text)" : "var(--text-muted)" }}>
            Annual <span style={{ color: "var(--success)", fontSize: "0.8rem" }}>Save 25%</span>
          </span>
        </div>
      </div>

      {/* Plans grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${plans.length}, 1fr)`,
        gap: "1.5rem",
        maxWidth: plans.length === 2 ? 720 : 1000,
        margin: "0 auto",
      }}>
        {plans.map((plan) => (
          <div key={plan.name} className="card" style={{
            border: plan.highlight ? `2px solid ${plan.color}` : "1px solid var(--border)",
            position: "relative",
            transform: plan.highlight ? "scale(1.03)" : "none",
            boxShadow: plan.highlight ? `0 8px 32px ${plan.color}33` : undefined,
          }}>
            {plan.highlight && (
              <div style={{
                position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                background: plan.color, color: "#fff", padding: "0.25rem 1rem",
                borderRadius: 999, fontSize: "0.8rem", fontWeight: 700, whiteSpace: "nowrap",
              }}>
                ⭐ {plan.tag}
              </div>
            )}

            <div style={{ marginBottom: "1rem" }}>
              <h2 style={{ color: plan.color, margin: "0 0 0.25rem" }}>{plan.name}</h2>
              {!plan.highlight && <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{plan.tag}</span>}
            </div>

            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)", marginBottom: "1.5rem" }}>
              {formatPrice(plan)}
              {billing === "annual" && plan.price.annual > 0 && (
                <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--text-muted)", display: "block" }}>
                  Billed ₹{(plan.price.annual * 12).toLocaleString("en-IN")} / year
                </span>
              )}
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", lineHeight: 2 }}>
              {plan.features.map((f) => (
                <li key={f} style={{ fontSize: "0.9rem", color: "var(--text)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: plan.color }}>✓</span> {f}
                </li>
              ))}
            </ul>

            <Link
              to={plan.href}
              className={plan.highlight ? "btn-primary" : "btn-ghost"}
              style={{ display: "block", textAlign: "center", textDecoration: "none", padding: "0.75rem" }}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 600, margin: "3rem auto 0", textAlign: "center" }}>
        <h3>Frequently Asked Questions</h3>
        <div className="card" style={{ textAlign: "left", marginTop: "1rem" }}>
          {[
            ["Can I switch plans?", "Yes, upgrade or downgrade anytime from your dashboard settings."],
            ["Is 2FA required?", "Yes, all accounts use Google Authenticator for security after signup."],
            ["What is the transcript email?", "After each interview, you receive the full Q&A transcript and AI report in your inbox, powered by WisprFlow-style real-time transcription."],
            ["Institution discount?", "Contact us at institutions@interviewai.in for bulk student licenses."],
          ].map(([q, a]) => (
            <div key={q} style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontWeight: 700, marginBottom: "0.25rem" }}>{q}</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
