import React, { useEffect, useState } from "react";

const AdminDashboard = () => {
  const [institutions, setInstitutions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", allowedDomains: "", studentLimit: 100, perStudentPrice: 0 });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/institutions", { headers, credentials: "include" }).then((r) => r.json()),
      fetch("/api/admin/stats", { headers, credentials: "include" }).then((r) => r.json()),
    ])
      .then(([inst, s]) => {
        setInstitutions(Array.isArray(inst) ? inst : []);
        setStats(s);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await fetch(`/api/admin/institutions/${id}/status`, {
      method: "PUT",
      headers,
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    load();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    const domains = form.allowedDomains.split(",").map((d) => d.trim()).filter(Boolean);
    const res = await fetch("/api/admin/institutions", {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ ...form, allowedDomains: domains }),
    });
    const data = await res.json();
    if (!res.ok) return setFormError(data.message || "Failed");
    setFormSuccess(`Institution "${data.name}" created!`);
    setForm({ name: "", allowedDomains: "", studentLimit: 100, perStudentPrice: 0 });
    load();
  };

  const statusBadge = (s) => {
    if (s === "ACTIVE") return <span className="badge badge-green">Active</span>;
    if (s === "REJECTED") return <span className="badge badge-red">Rejected</span>;
    return <span className="badge badge-yellow">Pending</span>;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Admin Panel 🛡️</h1>
          <p>Manage institutions and view platform analytics</p>
        </div>
      </div>

      {/* Platform stats */}
      {stats && (
        <div className="cards-grid" style={{ marginBottom: "2rem" }}>
          <div className="stat-card">
            <div className="stat-value">{stats.users ?? "—"}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.interviews ?? "—"}</div>
            <div className="stat-label">Total Interviews</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.completedInterviews ?? "—"}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.averageScore ?? "—"}</div>
            <div className="stat-label">Avg. Score</div>
          </div>
        </div>
      )}

      {/* Add institution */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>Add Institution</h2>
        <form onSubmit={handleCreate}>
          <div className="form-row-2">
            <div className="form-group">
              <label>Institution Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme University" required />
            </div>
            <div className="form-group">
              <label>Allowed Domains * <span className="form-hint">(comma-separated)</span></label>
              <input value={form.allowedDomains} onChange={(e) => setForm({ ...form, allowedDomains: e.target.value })} placeholder="acme.edu, students.acme.edu" required />
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label>Student Limit</label>
              <input type="number" min={1} value={form.studentLimit} onChange={(e) => setForm({ ...form, studentLimit: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Per-Student Price (₹)</label>
              <input type="number" min={0} value={form.perStudentPrice} onChange={(e) => setForm({ ...form, perStudentPrice: Number(e.target.value) })} />
            </div>
          </div>
          {formError && <div className="alert alert-error">{formError}</div>}
          {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
          <button type="submit" className="btn-primary" style={{ maxWidth: 200 }}>Create Institution</button>
        </form>
      </div>

      {/* Institutions table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Institutions ({institutions.length})</h2>
        </div>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>
        ) : institutions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏛️</div>
            <p>No institutions yet. Create one above.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Domains</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map((inst) => (
                  <tr key={inst.id}>
                    <td><strong>{inst.name}</strong></td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      {(inst.allowedDomains || []).join(", ")}
                    </td>
                    <td>{inst.studentsRegistered ?? 0} / {inst.studentLimit}</td>
                    <td>{statusBadge(inst.approvalStatus)}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {inst.approvalStatus !== "ACTIVE" && (
                          <button className="btn-primary" style={{ width: "auto", padding: "0.35rem 0.75rem", fontSize: "0.8rem" }} onClick={() => updateStatus(inst.id, "ACTIVE")}>
                            Approve
                          </button>
                        )}
                        {inst.approvalStatus !== "REJECTED" && (
                          <button className="btn-danger" onClick={() => updateStatus(inst.id, "REJECTED")}>
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
