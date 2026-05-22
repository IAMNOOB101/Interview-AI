import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (_) {}

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (_) {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-icon">🎯</span>
        <span className="brand-text">InterviewAI</span>
      </Link>

      <button
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
      >
        <span className="bar" />
        <span className="bar" />
        <span className="bar" />
      </button>

      <div className={`nav-links ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)}>
        {!user && (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="nav-link nav-link-cta">Get Started</Link>
          </>
        )}

        {user && user.accountType !== "admin" && (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/interview" className="nav-link">Start Interview</Link>
          </>
        )}

        {user && user.accountType === "admin" && (
          <>
            <Link to="/admin" className="nav-link">Admin Panel</Link>
          </>
        )}

        {user && (
          <div className="nav-user">
            <span className="nav-greeting">Hi, {user.firstName || "User"}</span>
            <button className="btn-logout" onClick={logout}>Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
