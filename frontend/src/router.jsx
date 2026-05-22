import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home           from "./pages/Home";
import Login          from "./pages/Login";
import Signup         from "./pages/Signup";
import Dashboard      from "./pages/Dashboard";
import Interview      from "./pages/Interview";
import InterviewSetup from "./pages/InterviewSetup";
import InterviewReport from "./pages/InterviewReport";
import History        from "./pages/History";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

const AppRoutes = () => (
  <Routes>
    <Route path="/"        element={<Home />} />
    <Route path="/login"   element={<Login />} />
    <Route path="/signup"  element={<Signup />} />

    <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/setup"      element={<ProtectedRoute><InterviewSetup /></ProtectedRoute>} />
    <Route path="/interview"  element={<ProtectedRoute><Interview /></ProtectedRoute>} />
    <Route path="/history"    element={<ProtectedRoute><History /></ProtectedRoute>} />
    <Route path="/report/:sessionId" element={<ProtectedRoute><InterviewReport /></ProtectedRoute>} />

    <Route path="/admin"  element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
