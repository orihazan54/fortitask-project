import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { sendPasswordResetEmail, resetPassword } from "../services/api";
import NavBar from "../components/NavBar";
import "../styles/ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // שלב הטופס: 1 - אימייל, 2 - קוד אימות וסיסמה
  const navigate = useNavigate();

  const handleSendEmail = async () => {
    try {
      await sendPasswordResetEmail({ email });
      toast.success("Verification code sent to your email.");
      setStep(2); // מעבר לשלב הבא
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send email.");
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      await resetPassword({ email, verificationCode, newPassword });
      toast.success("Password reset successfully.");
      navigate("/login"); // חזרה לדף ההתחברות
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password.");
    }
  };

  return (
    <>
      <NavBar />
      <div className="forgot-password-container">
        <div className="card">
          {step === 1 && (
            <>
              <h2>Forgot Your Password?</h2>
              <p>Enter your email below to reset your password.</p>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button onClick={handleSendEmail} className="btn">
                Send Reset Email
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <h2>Enter Verification Code</h2>
              <input
                type="text"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
              <h2>Reset Your Password</h2>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button onClick={handleResetPassword} className="btn">
                Reset Password
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
