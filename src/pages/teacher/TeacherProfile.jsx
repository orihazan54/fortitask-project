import React, { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import { getUserDetails, updateUserDetails } from "../../services/api";
import "../../styles/TeacherProfile.css";
import { toast } from "react-toastify";

const TeacherProfile = () => {
  const [profile, setProfile] = useState(null);
  const [newPassword, setNewPassword] = useState("");
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

  const handlePasswordChange = async () => {
    if (!newPassword) {
      toast.error("Please enter a new password.");
      return;
    }

    try {
      await updateUserDetails({ password: newPassword });
      toast.success("Password updated successfully!");
      setNewPassword(""); // איפוס שדה הסיסמה
    } catch (error) {
      toast.error("Failed to update password.");
    }
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!profile) {
    return <div>No profile data found.</div>;
  }

  return (
    <>
      <NavBar />
      <div className="profile-container">
        <div className="profile-card">
          <h2 className="profile-header">Teacher Profile</h2>
          <div className="profile-info">
            <p>
              <strong>Username:</strong> {profile.username}
            </p>
            <p>
              <strong>Email:</strong> {profile.email}
            </p>
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

export default TeacherProfile;
