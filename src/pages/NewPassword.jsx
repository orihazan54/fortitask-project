import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/api";
import { toast } from "sonner";
import "../styles/NewPassword.css";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

// Secure password reset component with comprehensive validation and strength checking
const NewPassword = () => {
  // State management for password reset workflow
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { email, verificationCode } = location.state || {}; // Get email and verification code from navigation state

  // Comprehensive password security requirements configuration
  // Password requirements criteria
  const requirements = [
    { id: "length", label: "At least 8 characters", regex: /.{8,}/ },
    { id: "uppercase", label: "At least one uppercase letter", regex: /[A-Z]/ },
    { id: "lowercase", label: "At least one lowercase letter", regex: /[a-z]/ },
    { id: "number", label: "At least one number", regex: /[0-9]/ },
    { id: "special", label: "At least one special character (!@#$%^&*)", regex: /[@$!%*?&#]/ }
  ];

  // Security validation to ensure proper reset flow
  useEffect(() => {
    // Redirect if missing required data
    if (!email || !verificationCode) {
              toast.error("Missing required information. Please restart the password reset process.");
      navigate("/forgot-password");
    }
  }, [email, verificationCode, navigate]);

  // Advanced password strength analysis with multiple security criteria
  const checkPasswordStrength = (password) => {
    if (!password) return "";
    
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

  // Real-time password validation with strength assessment
  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    setPasswordStrength(checkPasswordStrength(value));
    setError("");
  };

  // Comprehensive password reset submission with validation
  const handleResetPassword = async () => {
    // Client-side validation before submission
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (passwordStrength === "Weak") {
      setError("Password is too weak. Please choose a stronger password.");
      return;
    }

    // Ensure all security requirements are met
    // Check all password requirements
    for (const requirement of requirements) {
      if (!requirement.regex.test(newPassword)) {
        setError(`Password does not meet the requirement: ${requirement.label}`);
        return;
      }
    }

    if (!email || !verificationCode) {
      setError("Missing required information. Please go back to the password reset page.");
      navigate("/forgot-password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("Resetting password with:", { 
        email, 
        verificationCode, 
        hasNewPassword: !!newPassword,
        passwordLength: newPassword.length,
        passwordMeetsRequirements: requirements.every(req => req.regex.test(newPassword))
      });
      
      const response = await resetPassword({ email, verificationCode, newPassword });
      console.log("Password reset response:", response);
      
              toast.success("Password reset successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Reset password error:", error);
      setError(error.response?.data?.message || "Failed to reset password. Please try again.");
              toast.error(error.response?.data?.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="new-password-container">
      <div className="form">
        <h2>Create a New Password</h2>
        <p>Enter your new password below.</p>
        
        {/* Error message display with visual indicators */}
        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        
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
        
        {/* Real-time password strength feedback */}
        {passwordStrength && (
          <p className={`password-strength ${passwordStrength.toLowerCase()}`}>
            Password Strength: {passwordStrength}
          </p>
        )}
        
        {/* Password confirmation input with visibility toggle */}
        <div className="password-field">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError("");
            }}
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
            {requirements.map((req) => (
              <li 
                key={req.id} 
                className={req.regex.test(newPassword) ? "met" : ""}
              >
                {req.regex.test(newPassword) ? (
                  <CheckCircle size={16} className="check-icon" />
                ) : null}
                {req.label}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Password reset submission button with loading state */}
        <button 
          className="reset-button"
          onClick={handleResetPassword}
          disabled={isLoading}
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </button>
        
        {/* Navigation back to forgot password page */}
        <p className="mt-4">
          <button 
            className="text-link" 
            onClick={() => navigate("/forgot-password")}
            disabled={isLoading}
          >
            Back to Forgot Password
          </button>
        </p>
      </div>
    </div>
  );
};

export default NewPassword;