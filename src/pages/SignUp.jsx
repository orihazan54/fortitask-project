
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "../services/api";
import { toast } from "react-toastify";
import NavBar from "../components/NavBar";
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
    // משתמשים ב-regex פשוט יותר שתואם לבדיקה בצד השרת
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
    
    if (isSubmitting) return; // מניעת שליחה כפולה
    
    // בדיקות בסיסיות לפני שליחה
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
      console.log("Attempting to sign up with:", {
        ...formData,
        password: "***hidden***",
        confirmPassword: "***hidden***"
      });
      
      const response = await signup({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      
      console.log("Signup response:", response);
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
    <>
      <NavBar />
      <div className="signup-container">
        <div className="card">
          <h2>Join Us!</h2>
          <p>Create your account below</p>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
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
            <p className={`password-strength ${passwordStrength.toLowerCase()}`}>
              Password Strength: {passwordStrength}
            </p>
            <div className="password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <span
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <i className="fas fa-eye-slash"></i>
                ) : (
                  <i className="fas fa-eye"></i>
                )}
              </span>
            </div>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
            </select>
            <button type="submit" className="btn" disabled={isSubmitting}>
              {isSubmitting ? "Signing Up..." : "Sign Up"}
            </button>
          </form>
          <p>
            Already have an account?{" "}
            <span onClick={() => navigate("/login")} className="link">
              Login
            </span>
          </p>
        </div>
      </div>
    </>
  );
};

export default SignUp;