import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { sendPasswordResetEmail, resetPassword } from "../services/api";
import NavBar from "../components/NavBar";
import "../styles/ForgotPassword.css";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

// Comprehensive password reset workflow with email verification and security validation
const ForgotPassword = () => {
  // State management for two-step password reset process
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(""); 
  const [step, setStep] = useState(1); // Step 1: Email, Step 2: Verification code and password
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Advanced password strength validation with multiple security criteria
  const checkPasswordStrength = (password) => {
    const strongRegex = new RegExp(
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
    );
    const mediumRegex = new RegExp(
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{6,})"
    );

    if (strongRegex.test(password)) return "Strong";
    if (mediumRegex.test(password)) return "Medium";
    return "Weak";
  };

  // Real-time password strength assessment for user feedback
  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    setPasswordStrength(checkPasswordStrength(value));
  };

  // Step 1: Email verification request with validation
  const handleSendEmail = async () => {
    // Email format validation before API call
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
              toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Sending password reset email to:", email);
      const response = await sendPasswordResetEmail({ email });
      console.log("Response:", response);
      
              toast.success("Verification code sent to your email");
      setStep(2); // Move to next step
    } catch (error) {
      console.error("Password reset error:", error);
              toast.error(error.response?.data?.message || "Failed to send email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Password reset with verification code validation
  const handleResetPassword = async () => {
    // Comprehensive form validation before submission
    if (!verificationCode || !newPassword || !confirmPassword) {
              toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
              toast.error("Passwords do not match");
      return;
    }

    if (passwordStrength === "Weak") {
              toast.error("Password is too weak. Please choose a stronger password");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Resetting password with:", { 
        email, 
        verificationCode,  
        newPassword: "********" // Hide actual password in logs
      });
      
      await resetPassword({ email, verificationCode, newPassword });
              toast.success("Password reset successfully");
      navigate("/login");
    } catch (error) {
      console.error("Password reset error:", error);
              toast.error(error.response?.data?.message || "Password reset failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <NavBar />
      <div className="forgot-password-container">
        <div className="card">
          {/* Step 1: Email address collection for verification */}
          {step === 1 && (
            <>
              <h2>Forgot Password?</h2>
              <p>Enter your email address to reset your password.</p>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <button 
                onClick={handleSendEmail} 
                className="btn"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Email"}
              </button>
            </>
          )}
          
          {/* Step 2: Verification code and new password entry */}
          {step === 2 && (
            <>
              <h2>Enter Verification Code</h2>
              <input
                type="text"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={isLoading}
              />
              <h2>Reset Your Password</h2>
              
              {/* Secure password input with visibility toggle */}
              <div className="password-field">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  disabled={isLoading}
                />
                <span
                  className="password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>
              
              {/* Real-time password strength indicator */}
              <p className={`password-strength ${passwordStrength.toLowerCase()}`}>
                Password Strength: {passwordStrength}
              </p>
              
              {/* Password confirmation input with visibility toggle */}
              <div className="password-field">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                <span
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>
              
              {/* Interactive password requirements checklist */}
              <div className="password-requirements">
                <h4>Password Requirements:</h4>
                <ul>
                  <li className={newPassword?.length >= 8 ? "met" : ""}>
                    At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(newPassword) ? "met" : ""}>
                    At least one uppercase letter
                  </li>
                  <li className={/[a-z]/.test(newPassword) ? "met" : ""}>
                    At least one lowercase letter
                  </li>
                  <li className={/[0-9]/.test(newPassword) ? "met" : ""}>
                    At least one number
                  </li>
                  <li className={/[!@#$%^&*]/.test(newPassword) ? "met" : ""}>
                    At least one special character (!@#$%^&*)
                  </li>
                </ul>
              </div>
              
              {/* Password reset submission button */}
              <button 
                onClick={handleResetPassword} 
                className="btn"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
              
              {/* Navigation back to email step */}
              <p className="mt-4">
                <button 
                  className="text-link" 
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                >
                  Back to Email
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;