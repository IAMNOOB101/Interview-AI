import { useEffect, useState } from "react";
import { getAllUsers } from "../../services/adminApi";

export default function Users() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllUsers()
      .then((r) => setUsers(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: "1.5rem" }}>All Users</h2>
      {loading ? <div className="spinner" /> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Type</th></tr></thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id}>
                  <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                  <td><strong>{u.firstName} {u.lastName}</strong></td>
                  <td style={{ color: "var(--text-muted)" }}>{u.email}</td>
                  <td><span className="badge badge-blue">{u.accountType}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
