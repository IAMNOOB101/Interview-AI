import { useEffect, useState } from "react";
import { getDomainStats } from "../../services/adminApi";

export default function Analytics() {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDomainStats()
      .then((r) => setData(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: "1.5rem" }}>Domain Analytics</h2>
      {loading ? <div className="spinner" /> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>Domain</th><th>Interviews</th><th>Avg Score</th></tr></thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.domain}>
                  <td><strong>{d.domain}</strong></td>
                  <td>{d.count}</td>
                  <td><span className={`badge ${d.avgScore >= 7 ? "badge-green" : "badge-yellow"}`}>{d.avgScore}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
