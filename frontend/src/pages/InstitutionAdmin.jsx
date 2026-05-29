import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = (path, opts = {}) =>
  fetch(path, { credentials: "include", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` }, ...opts });

export default function InstitutionAdmin() {
  const navigate = useNavigate();
  const [stats, setStats]   = useState(null);
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  let user = null;
  try { user = JSON.parse(localStorage.getItem("user")); } catch (_) {}

  useEffect(() => {
    if (!user || (user.accountType !== "admin" && user.accountType !== "institution_admin")) {
      navigate("/dashboard");
      return;
    }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        API("/api/admin/stats"),
        API("/api/admin/users"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) {
        const d = await usersRes.json();
        setUsers(d.users || d);
      }
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId, newAccountType) => {
    const res = await API(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ accountType: newAccountType }),
    });
    if (res.ok) load();
    else setError("Failed to update role");
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user?")) return;
    const res = await API(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) load();
    else setError("Failed to delete user");
  };

  if (loading) return <div className="page-container" style={{ textAlign: "center", paddingTop: "4rem" }}><div className="spinner" /><p>Loading…</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>🏛 Institution Admin Dashboard</h1>
          <p>Manage users, monitor performance, and control access</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stats */}
      {stats && (
        <div className="cards-grid" style={{ marginBottom: "2rem" }}>
          {[
            ["Total Users", stats.users ?? "—"],
            ["Total Interviews", stats.interviews ?? "—"],
            ["Completed", stats.completedInterviews ?? "—"],
            ["Avg Score", stats.averageScore ?? "—"],
          ].map(([label, value]) => (
            <div key={label} className="stat-card">
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* RBAC — User Management */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>👥 Users & Role Management (RBAC)</h2>
          <span className="badge badge-blue">{users.length} users</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-secondary)" }}>
                {["Name", "Email", "Role", "Interviews", "Joined", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.75rem 1rem" }}>{u.firstName} {u.lastName}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>{u.email}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <select
                      value={u.accountType}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      style={{ fontSize: "0.85rem", padding: "0.25rem 0.5rem", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)" }}
                    >
                      <option value="student">Student</option>
                      <option value="professional">Professional</option>
                      <option value="admin">Admin</option>
                      <option value="institution_admin">Institution Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>{u.interviewCount ?? "—"}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <button
                      className="btn-ghost"
                      style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", color: "var(--error)" }}
                      onClick={() => deleteUser(u.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No users found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
