import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { toast } from "react-toastify";
import NavBar from "../components/NavBar";
import "../styles/Login.css";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await login(formData);
      toast.success("Login successful!");

      // שמירת הטוקן ב-localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);
      } else {
        toast.error("Failed to retrieve token.");
        return;
      }

      // ניווט לפי תפקיד המשתמש
      if (data.role === "Student") {
        navigate("/student-dashboard");
      } else if (data.role === "Teacher") {
        navigate("/teacher-dashboard");
      } else {
        toast.error("User role not recognized.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar />
      <div className="login-container">
        <div className="card">
          <h2>Welcome Back!</h2>
          <p>Login to manage your tasks</p>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
          <p>
            Don't have an account?{" "}
            <span onClick={() => navigate("/signup")} className="link">
              Sign Up
            </span>
          </p>
          <p className="forgot-password">
            Forgot your password?{" "}
            <span onClick={() => navigate("/forgot-password")} className="link">
              Reset it here
            </span>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;
