import React from "react";
import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute — wraps a page and redirects to /login if not authenticated.
 * Pass allowedRoles={["admin"]} to restrict by account type.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  let user = null;
  let token = null;
  try {
    token = localStorage.getItem("token");
    user = JSON.parse(localStorage.getItem("user"));
  } catch (_) {}

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.accountType)) {
    // institution_admin gets own dashboard, others go to /dashboard
    if (user.accountType === "institution_admin") {
      return <Navigate to="/institution-admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
