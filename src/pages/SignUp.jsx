import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../services/api";
import { toast } from "sonner";
import NavBar from "../components/NavBar";
import { Button } from "../components/ui/button";
import "../styles/SignUp.css";

// User registration component with comprehensive validation and role selection
const SignUp = () => {
  // Complete form state management for user registration
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Student",
  });
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Form input handler with real-time password strength assessment
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Real-time password strength evaluation for better user experience
    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));
    }
    setFormData({ ...formData, [name]: value });
  };

  // Advanced password strength validation with multiple security criteria
  const checkPasswordStrength = (password) => {
    // Strong password: 8+ chars, upper, lower, number, special character
    const strongRegex = new RegExp(
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$"
    );
    // Medium password: 6+ chars, upper, lower, number
    const mediumRegex = new RegExp(
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9]{6,}$"
    );

    if (strongRegex.test(password)) return "Strong";
    if (mediumRegex.test(password)) return "Medium";
    return "Weak";
  };

  // Comprehensive form submission with validation and error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Prevent double submission during processing
    if (isSubmitting) return;

    // Client-side validation before API call
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
              toast.error("Please fill in all fields.");
      return;
    }

    // Password confirmation validation for security
    if (formData.password !== formData.confirmPassword) {
              toast.error("Passwords do not match.");
      return;
    }

    // Enforce minimum password security standards
    if (passwordStrength === "Weak") {
              toast.error("Password is too weak. Please choose a stronger password.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit sanitized registration data to backend
      const response = await signup({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

              toast.success("Account created successfully!");
      // Redirect to login page after successful registration
      navigate("/login");
    } catch (error) {
      console.error("Signup error:", error);
      // User-friendly error messaging for registration failures
      const errorMessage = error.response?.data?.message || "Sign-up failed!";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-page bg-gradient">
      <NavBar />
      <main className="flex-center p-6">
        {/* Registration card with animated appearance */}
        <div className="signup-card animate-fade-in">
          <h2 className="signup-title bg-gradient-text">Create Account</h2>
          <p className="signup-description">Join our community now!</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username input with validation */}
            <div className="input-group">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            
            {/* Email input with built-in HTML5 validation */}
            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            
            {/* Password input with visibility toggle and strength indicator */}
            <div className="input-group password-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                required
              />
              <button
                type="button"
                className="eye-button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Real-time password strength feedback with color coding */}
            <p className={`password-strength ${passwordStrength.toLowerCase()}`}>
              Password Strength: {passwordStrength}
            </p>

            {/* Password confirmation with visibility toggle */}
            <div className="input-group password-group">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
                required
              />
              <button
                type="button"
                className="eye-button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Role selection for user type determination */}
            <div className="input-group">
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
              </select>
            </div>

            {/* Submit button with loading state indication */}
            <Button 
              type="submit"
              className="signup-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing Up..." : "Sign Up"}
            </Button>
          </form>

          {/* Navigation link to login page for existing users */}
          <p className="signup-footer">
            Already have an account?{" "}
            <span className="signup-link" onClick={() => navigate("/login")}>
              Login
            </span>
          </p>
        </div>
      </main>
    </div>
  );
};

export default SignUp;