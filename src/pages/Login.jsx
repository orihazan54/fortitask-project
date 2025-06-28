import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, checkAuthentication } from "../services/api";
import NavBar from "../components/NavBar";
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import "../styles/Login.css";

// Secure login component with Two-Factor Authentication support
const Login = () => {
  // Form state management for user credentials and authentication flow
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [loginAttemptData, setLoginAttemptData] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  // Automatic redirect for already authenticated users
  useEffect(() => {
    const { isAuthenticated, role } = checkAuthentication();
    if (isAuthenticated) {
      navigate(role === "Student" ? "/student-dashboard" : "/teacher-dashboard");
    }
  }, [navigate]);

  // Form input handler with real-time error clearing
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear field-specific errors when user starts typing
    setFieldErrors(prev => ({ ...prev, [e.target.name]: "" }));
  };

  // Sanitized 2FA code input with format validation
  const handle2FACodeChange = (e) => {
    // Only allow digits and limit to 6 characters for security
    const value = e.target.value.replace(/[^\d]/g, '').substring(0, 6);
    setTwoFactorCode(value);
  };

  // Comprehensive login submission with 2FA support
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation before API call
    if (!formData.email || !formData.password) {
              toast.error("Please fill in all required fields");
      return;
    }
    if (requiresTwoFactor && !twoFactorCode) {
              toast.error("Please enter your two-factor authentication code");
      return;
    }
    
    setLoading(true);
    setLoginInProgress(true);

    try {
      // Determine login payload based on authentication step
      const loginData = requiresTwoFactor
        ? { ...loginAttemptData, twoFactorCode: twoFactorCode.trim() }
        : formData;

      console.log("Login attempt with data:", loginData);
      const response = await login(loginData);
      const { data } = response;
      console.log("Login response:", data);

      // Handle 2FA requirement step
      if (data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setLoginAttemptData(formData);
        toast.info(data.message || "Two-factor authentication required");
        setLoading(false);
        setLoginInProgress(false);
        return;
      }

              toast.success("Login successful!");

      // Secure session setup with localStorage management
      // Clear localStorage and set new values
      localStorage.clear();
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("role", data.role);
      localStorage.setItem("username", data.username || "User");

      // Role-based navigation with slight delay for state update
      setTimeout(() => {
        const role = localStorage.getItem("role");
        navigate(role === "Student" ? "/student-dashboard" : "/teacher-dashboard");
      }, 300);
    } catch (error) {
      console.error("Login error:", error);
      
      // Comprehensive error handling for different authentication scenarios
      // Display all errors as toast messages
      if (error.response?.status === 400 && error.response?.data?.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setLoginAttemptData(formData);
        toast.info(error.response.data.message || "Two-factor authentication required");
      } else {
        // User-friendly error messaging with field-specific feedback
        // Create error message and display it as toast
        const errorMessage = error.response?.data?.message || error.message || "Login failed! Please check your credentials";
        toast.error(errorMessage);

        // Visual field error indicators for better UX
        // Mark field errors
        if (errorMessage.toLowerCase().includes("email")) {
          setFieldErrors(prev => ({ ...prev, email: "Invalid email" }));
        }
        if (errorMessage.toLowerCase().includes("password")) {
          setFieldErrors(prev => ({ ...prev, password: "Incorrect password" }));
        }
      }
    } finally {
      setLoading(false);
      setLoginInProgress(false);
    }
  };

  // Reset 2FA flow to return to initial login state
  const handleBackToLogin = () => {
    setRequiresTwoFactor(false);
    setTwoFactorCode("");
    setLoginAttemptData(null);
  };

  return (
    <div className="login-page bg-gradient">
      <NavBar />
      <main className="flex-center p-6">
        {/* Adaptive login card that changes based on authentication step */}
        <Card className="login-card animate-fade-in">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-text">
              {requiresTwoFactor ? "Two-Factor Authentication" : "Welcome Back!"}
            </CardTitle>
            <CardDescription>
              {requiresTwoFactor
                ? "Enter the code from your authenticator app"
                : "Login to manage your tasks"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {!requiresTwoFactor ? (
                <>
                  {/* Standard login form with accessible inputs and icons */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="email">Email</label>
                    <div className="input-container">
                      <Mail className="input-icon" />
                      <input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`input-field ${fieldErrors.email ? 'input-error' : ''}`}
                        required
                      />
                    </div>
                  </div>
                  {fieldErrors.email && <span className="field-error-text">{fieldErrors.email}</span>}
                  
                  <div className="input-group">
                    <label className="input-label" htmlFor="password">Password</label>
                    <div className="input-container">
                      <Lock className="input-icon" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`input-field ${fieldErrors.password ? 'input-error' : ''}`}
                        required
                      />
                      {/* Password visibility toggle for better user experience */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="eye-button"
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>
                  {fieldErrors.password && <span className="field-error-text">{fieldErrors.password}</span>}
                  
                  <Button 
                    type="submit" 
                    className="login-button" 
                    disabled={loading || loginInProgress}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </>
              ) : (
                // Two-Factor Authentication interface with clear instructions
                <div className="two-factor-container">
                  <ShieldCheck size={40} className="text-blue-400" />
                  <p>Enter the 6-digit code from your authenticator app</p>
                  <input
                    type="text"
                    name="twoFactorCode"
                    placeholder="000000"
                    value={twoFactorCode}
                    onChange={handle2FACodeChange}
                    className="verification-code-input"
                    autoComplete="off"
                    autoFocus
                  />
                  <div className="verification-buttons">
                    <Button type="submit" className="login-button">
                      {loading ? "Verifying..." : "Verify"}
                    </Button>
                    <Button 
                      type="button"
                      variant="secondary"
                      className="back-button"
                      onClick={handleBackToLogin}
                    >
                      Back to Login Form
                    </Button>
                  </div>
                </div>
              )}
            </form>

            {!requiresTwoFactor && (
              <div className="links-container">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Button variant="link" className="signup-link" onClick={() => navigate("/signup")}>
                    Sign Up
                  </Button>
                </p>
                <Button variant="link" className="forgot-link" onClick={() => navigate("/forgot-password")}>
                  Forgot Password?
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Login;