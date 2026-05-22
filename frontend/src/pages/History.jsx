import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHistory } from "../services/interview.service.js";

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getHistory()
      .then((r) => setSessions(r.data.sessions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const scoreColor = (s) => {
    if (!s) return "badge-blue";
    if (s >= 8) return "badge-green";
    if (s >= 5) return "badge-yellow";
    return "badge-red";
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Interview History</h1>
        <Link to="/interview" className="btn-primary" style={{ width: "auto", padding: "0.65rem 1.25rem", textDecoration: "none", display: "inline-block", borderRadius: 8 }}>
          + New Interview
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", paddingTop: "3rem" }}><div className="spinner" /></div>
      ) : sessions.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">📋</div>
          <h3>No interviews yet</h3>
          <p>Complete your first mock interview to see results here.</p>
          <Link to="/interview" className="btn-primary" style={{ width: "auto", display: "inline-block", padding: "0.75rem 1.5rem", textDecoration: "none", borderRadius: 8, marginTop: "0.75rem" }}>
            Start Interview
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th><th>Domain</th><th>Date</th><th>Score</th><th>Level</th><th>Report</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                    <td><strong>{s.domain || "General"}</strong></td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                      {new Date(s.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td>
                      <span className={`badge ${scoreColor(s.finalScore)}`}>
                        {s.finalScore != null ? `${Number(s.finalScore).toFixed(1)} / 10` : "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${s.confidenceLevel === "High" ? "badge-green" : s.confidenceLevel === "Low" ? "badge-red" : "badge-yellow"}`}>
                        {s.confidenceLevel || "—"}
                      </span>
                    </td>
                    <td>
                      <Link to={`/report/${s.id}`} style={{ color: "var(--primary)", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none" }}>
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
