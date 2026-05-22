import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Login failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      // Redirect based on role
      if (data.user?.accountType === "admin") navigate("/admin");
      else navigate("/dashboard");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/guest", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Guest login failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({ accountType: "guest", firstName: "Guest" }));
      navigate("/dashboard");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

   return (
     <div className="auth-page">
       <div className="auth-card">
         <div className="auth-header">
           <div className="auth-icon">🎯</div>
           <h1>Welcome Back</h1>
           <p>Login to continue your interview prep</p>
         </div>

         <form onSubmit={handleSubmit} className="auth-form">
           <div className="form-group">
             <label htmlFor="email">Email Address</label>
             <input
               id="email"
               name="email"
               type="email"
               placeholder="you@example.com"
               onChange={handleChange}
               required
               autoComplete="email"
             />
           </div>

           <div className="form-group">
             <label htmlFor="password">Password</label>
             <input
               id="password"
               name="password"
               type="password"
               placeholder="••••••••"
               onChange={handleChange}
               required
               autoComplete="current-password"
             />
           </div>

           {error && <div className="alert alert-error">{error}</div>}

           <button type="submit" className="btn-primary" disabled={loading}>
             {loading ? "Logging in…" : "Login"}
           </button>

           <button type="button" className="btn-ghost" onClick={handleGuest} disabled={loading}>
             {loading ? "…" : "Continue as Guest"}
           </button>
         </form>

         <div className="auth-footer">
           <p>Don't have an account? <Link to="/signup">Create one</Link></p>
         </div>
       </div>
     </div>
   );
};

export default Login;
