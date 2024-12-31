import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail, verifyCode } from "../services/api";
import { toast } from "react-toastify";
import NavBar from "../components/NavBar";
import "../styles/ResetPassword.css";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false); // האם קוד האימות נשלח
  const [codeVerified, setCodeVerified] = useState(false); // האם קוד האימות אומת

  const navigate = useNavigate();

  // שליחת קוד אימות
  const handleSendCode = async () => {
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }

    try {
      await sendPasswordResetEmail({ email });
      toast.success("Verification code sent to your email.");
      setCodeSent(true); // הצגת תיבת קוד האימות
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send verification code.");
    }
  };

  // אימות קוד האימות
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      toast.error("Please enter the verification code.");
      return;
    }

    try {
      await verifyCode({ email, verificationCode }); // אימות במייל ובקוד האימות
      toast.success("Verification code is correct!");
      setCodeVerified(true); // מעבר להזנת סיסמה חדשה
      navigate("/new-password", { state: { email } }); // מעבר לדף סיסמה חדשה
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid verification code.");
    }
  };

  return (
    <>
      <NavBar />
      <div className="reset-password-container">
        <div className="form">
          <h2>Reset Your Password</h2>
          {!codeSent ? (
            <>
              <p>Enter your email to receive a verification code.</p>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button onClick={handleSendCode}>
                Send Reset Email
              </button>
            </>
          ) : (
            <>
              <p>Enter the verification code sent to your email.</p>
              <input
                type="text"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
              <button onClick={handleVerifyCode}>
                Verify Code
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
