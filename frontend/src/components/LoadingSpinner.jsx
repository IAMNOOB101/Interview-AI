export default function LoadingSpinner({ message = "Loading…" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: "1rem" }}>
      <div className="spinner" />
      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{message}</p>
    </div>
  );
}
