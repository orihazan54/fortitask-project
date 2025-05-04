
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "../services/api";
import { toast } from "react-toastify";
import NavBar from "../components/NavBar";
import { Button } from "../components/ui/button";
import "../styles/SignUp.css";

const SignUp = () => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));
    }
    setFormData({ ...formData, [name]: value });
  };

  const checkPasswordStrength = (password) => {
    const strongRegex = new RegExp(
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$"
    );
    const mediumRegex = new RegExp(
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9]{6,}$"
    );

    if (strongRegex.test(password)) return "Strong";
    if (mediumRegex.test(password)) return "Medium";
    return "Weak";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (passwordStrength === "Weak") {
      toast.error("Password is too weak. Please choose a stronger password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await signup({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      toast.success("Account created successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Signup error:", error);
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
        <div className="signup-card animate-fade-in">
          <h2 className="signup-title bg-gradient-text">Create Account</h2>
          <p className="signup-description">Join our community now!</p>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <p className={`password-strength ${passwordStrength.toLowerCase()}`}>
              Password Strength: {passwordStrength}
            </p>

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

            <Button 
              type="submit"
              className="signup-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing Up..." : "Sign Up"}
            </Button>
          </form>

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