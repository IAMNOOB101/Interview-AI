import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

const AUTH_PAGES = ["/login", "/signup"];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAuthPage = AUTH_PAGES.includes(location.pathname);

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
        {/* On auth pages: never show logout / user greeting */}
        {!isAuthPage && !user && (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="nav-link nav-link-cta">Get Started</Link>
          </>
        )}

        {/* User Profile Section - Merged */}
        {!isAuthPage && user && (
          <div className="nav-user">
            <button
              onClick={() => navigate("/profile")}
              className="user-profile-btn"
              title="Click to view profile"
            >
              <div className="user-avatar">
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </div>
              <div className="user-info">
                <span className="user-name">Hi, {user.firstName}! 👋</span>
                <span className="user-email">{user.email}</span>
              </div>
            </button>
            <button className="btn-logout" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;