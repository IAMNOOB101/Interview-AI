import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) { return { hasError: true, error }; }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-container" style={{ textAlign: "center", paddingTop: "4rem" }}>
          <h2>Something went wrong</h2>
          <p style={{ color: "var(--text-muted)" }}>{this.state.error?.message}</p>
          <button className="btn-primary" style={{ width: "auto", display: "inline-block", padding: "0.7rem 1.5rem", marginTop: "1rem" }}
            onClick={() => window.location.href = "/"}>
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
