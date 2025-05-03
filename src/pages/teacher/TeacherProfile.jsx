import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../../components/NavBar";
import { getUserDetails, updateUserDetails } from "../../services/api";
import { toast } from "react-toastify";
import "../../styles/TeacherProfile.css";

const TeacherProfile = () => {
  const [profile, setProfile] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
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
    const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})");
    const mediumRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{6,})");

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

  if (loading) return <div className="loading">Loading profile...</div>;
  if (!profile) return <div className="error">No profile data found.</div>;

  return (
    <>
      <NavBar />
      <div className="profile-page">
        <div className="profile-card glass-effect">
          <Link to="/teacher-dashboard" className="back-link-btn">
            ← Back
          </Link>

          <h2 className="profile-title">Teacher Profile</h2>

          <div className="profile-info">
            <p><strong>Username:</strong> {profile.username}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Created At:</strong> {new Date(profile.createdAt).toLocaleString()}</p>
          </div>

          <div className="password-update">
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
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherProfile;
