
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, checkAuthentication } from "../services/api";
import { toast } from "react-toastify";
import NavBar from "../components/NavBar";
import "../styles/Login.css";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [loginAttemptData, setLoginAttemptData] = useState(null);
  const navigate = useNavigate();

  // Check if user is already logged in on component mount
  useEffect(() => {
    const { isAuthenticated, role } = checkAuthentication();
    if (isAuthenticated) {
      console.log("User already authenticated, navigating to dashboard for role:", role);
      navigate(role === "Student" ? "/student-dashboard" : "/teacher-dashboard");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handle2FACodeChange = (e) => {
    // Only allow digits and limit to 6 characters
    const value = e.target.value.replace(/[^\d]/g, '').substring(0, 6);
    setTwoFactorCode(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields.");
      return;
    }

    // If 2FA is required, validate that the code is entered
    if (requiresTwoFactor && !twoFactorCode) {
      toast.error("Please enter the two-factor authentication code.");
      return;
    }

    setLoading(true);
    setLoginInProgress(true);
    
    try {
      // If we are in 2FA mode, send the saved login data with the 2FA code
      const loginData = requiresTwoFactor 
        ? { ...loginAttemptData, twoFactorCode: twoFactorCode.trim() } 
        : formData;

      console.log("Sending login data:", { 
        email: loginData.email, 
        has2FACode: !!loginData.twoFactorCode,
        twoFactorCodeLength: loginData.twoFactorCode ? loginData.twoFactorCode.length : 0
      });

      const { data } = await login(loginData);
      
      // Check if 2FA is required
      if (data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        // Store the current login data for when the user enters the 2FA code
        setLoginAttemptData(formData);
        toast.info(data.message || "Two-factor authentication code required");
        setLoading(false);
        return;
      }

      toast.success("Login successful!");

      // ENHANCED: More aggressive localStorage setting and verification
      localStorage.clear(); // Clear ALL localStorage to start fresh
      
      // Set the new values and verify they're set
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("role", data.role);
      localStorage.setItem("username", data.username || "User");
      
      console.log("Login successful, localStorage values set:", {
        token: !!localStorage.getItem("token"),
        userId: localStorage.getItem("userId"),
        role: localStorage.getItem("role"),
        username: localStorage.getItem("username")
      });
      
      // Wait for localStorage to be properly set
      setTimeout(() => {
        // Double check that role is valid
        const role = localStorage.getItem("role");
        const token = localStorage.getItem("token");
        
        if (!role || !token) {
          console.error("Critical error: localStorage not set properly");
          toast.error("Failed to save login information. Please try again.");
          return;
        }
        
        console.log(`Navigating to dashboard for role: ${role}`);
        
        if (role === "Student") {
          navigate("/student-dashboard");
        } else {
          navigate("/teacher-dashboard");
        }
      }, 300);
    } catch (error) {
      console.error("Login failed:", error);
      
      // Handle 2FA requirement from error response
      if (error.response?.status === 400 && error.response?.data?.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        // Store the current login data for when the user enters the 2FA code
        setLoginAttemptData(formData);
        toast.info(error.response.data.message || "Two-factor authentication code required");
      } else {
        toast.error(error.response?.data?.message || "Login failed! Please check your credentials.");
        
        // Clean localStorage on failed login
        localStorage.clear();
      }
    } finally {
      setLoading(false);
      setLoginInProgress(false);
    }
  };

  // Handle back to login to reset state
  const handleBackToLogin = () => {
    setRequiresTwoFactor(false);
    setTwoFactorCode("");
    setLoginAttemptData(null);
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
              disabled={requiresTwoFactor}
            />
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={requiresTwoFactor}
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <i className="fas fa-eye-slash"></i>
                ) : (
                  <i className="fas fa-eye"></i>
                )}
              </span>
            </div>
            
            {requiresTwoFactor && (
              <div className="two-factor-section">
                <h3>Two-Factor Authentication</h3>
                <p>Enter the 6-digit code from your authenticator app</p>
                <input
                  type="text"
                  name="twoFactorCode"
                  placeholder="Enter 6-digit code"
                  value={twoFactorCode}
                  onChange={handle2FACodeChange}
                  maxLength={6}
                  className="two-factor-input"
                  autoComplete="off"
                  autoFocus
                  pattern="\d{6}"
                  inputMode="numeric"
                />
              </div>
            )}
            
            <button type="submit" className="btn" disabled={loading || loginInProgress}>
              {loading ? "Logging in..." : requiresTwoFactor ? "Submit Code" : "Login"}
            </button>
            
            {requiresTwoFactor && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleBackToLogin}
              >
                Back to Login
              </button>
            )}
          </form>
          
          {!requiresTwoFactor && (
            <>
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
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Login;