import React, { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { getUserDetails, updateUserDetails } from "../../services/api";
import "../../styles/StudentProfile.css";
import { toast } from "react-toastify";

const StudentProfile = () => {
  const [profile, setProfile] = useState({});
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await getUserDetails();
        setProfile(data);
      } catch (error) {
        toast.error("Failed to load profile.");
      }
    };
    fetchProfile();
  }, []);

  const handlePasswordChange = async () => {
    try {
      await updateUserDetails({ password: newPassword });
      toast.success("Password updated successfully!");
    } catch (error) {
      toast.error("Failed to update password.");
    }
  };

  return (
    <>
      <NavBar />
      <div className="profile-container">
        <Sidebar role="Student" />
        <div className="profile-card">
          <h2 className="profile-header">Student Profile</h2>
          <div className="profile-info">
            <p><strong>Username:</strong> {profile.username}</p>
            <p><strong>Email:</strong> {profile.email}</p>
          </div>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button className="change-password-btn" onClick={handlePasswordChange}>
            Change Password
          </button>
        </div>
      </div>
    </>
  );
};

export default StudentProfile;
