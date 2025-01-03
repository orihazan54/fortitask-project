import React, { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import { getUserDetails, updateUserDetails } from "../../services/api";
import "../../styles/StudentProfile.css";
import { toast } from "react-toastify";

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(""); // חוזק סיסמה
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await getUserDetails();
        setProfile(data);
      } catch (error) {
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

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

  const handlePasswordChange = async () => {
    if (!newPassword) {
      toast.error("Please enter a new password.");
      return;
    }

    if (passwordStrength === "Weak") {
      toast.error("Password is too weak. Please choose a stronger password.");
      return;
    }

    try {
      await updateUserDetails({ password: newPassword });
      toast.success("Password updated successfully!");
      setNewPassword("");
      setPasswordStrength("");
    } catch (error) {
      toast.error("Failed to update password.");
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="error">No profile data found.</div>;
  }

  return (
    <>
      <NavBar />
      <div className="profile-container">
        <div className="profile-card">
          <h2 className="profile-header">Student Profile</h2>
          <div className="profile-info">
            <p><strong>Username:</strong> {profile.username}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Completed Assignments:</strong> 5</p>
            <p><strong>Active Courses:</strong> 3</p>
            <p>
              <strong>Created At:</strong> {new Date(profile.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="profile-actions">
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordStrength(checkPasswordStrength(e.target.value));
              }}
            />
            <p className={`password-strength ${passwordStrength.toLowerCase()}`}>
              Password Strength: {passwordStrength || "Not entered"}
            </p>
            <button className="change-password-btn" onClick={handlePasswordChange}>
              Change Password
            </button>
            <button className="back-btn" onClick={() => window.location.href = "/student-dashboard"}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentProfile;
