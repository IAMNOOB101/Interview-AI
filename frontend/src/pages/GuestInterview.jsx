import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function GuestInterview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    domain: "Software Engineering",
    role: "Software Engineer",
    experienceLevel: "fresher",
    salaryRange: { min: 5, max: 10 },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post(
        "/guest/interview/start",
        formData
      );

      if (response.data.success) {
        navigate(`/interview/${response.data.data.sessionId}?guest=true`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start interview");
      console.error("Guest interview error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-2">Guest Interview</h1>
        <p className="text-gray-600 text-center mb-6">
          No registration required. Start your mock interview now!
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="John"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="john@example.com"
            />
          </div>

          {/* Domain */}
          <div>
            <label className="block text-sm font-semibold mb-2">Domain *</label>
            <select
              name="domain"
              value={formData.domain}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option>Software Engineering</option>
              <option>Frontend Development</option>
              <option>Backend Development</option>
              <option>Full Stack Development</option>
              <option>Data Science</option>
              <option>DevOps</option>
              <option>Product Management</option>
            </select>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold mb-2">Role *</label>
            <input
              type="text"
              name="role"
              required
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Software Engineer"
            />
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Experience Level *
            </label>
            <select
              name="experienceLevel"
              value={formData.experienceLevel}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="fresher">Fresher (0 yrs)</option>
              <option value="junior">Junior (1-3 yrs)</option>
              <option value="mid">Mid-level (3-6 yrs)</option>
              <option value="senior">Senior (6+ yrs)</option>
            </select>
          </div>

          {/* Expected Salary */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Expected Salary (LPA)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={formData.salaryRange.min}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    salaryRange: {
                      ...prev.salaryRange,
                      min: parseInt(e.target.value) || 0,
                    },
                  }))
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={formData.salaryRange.max}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    salaryRange: {
                      ...prev.salaryRange,
                      max: parseInt(e.target.value) || 10,
                    },
                  }))
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition duration-200"
          >
            {loading ? "Starting Interview..." : "Start Interview"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Want to create an account?{" "}
          <a href="/signup" className="text-purple-600 font-semibold hover:underline">
            Sign up here
          </a>
        </p>
      </div>
    </div>
  );
}