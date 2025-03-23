
import React, { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { getUserDetails, updateUserDetails } from "../../services/api";
import { FaUser, FaEnvelope, FaLock, FaCalendarAlt, FaIdCard, FaBriefcase, FaShieldAlt, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import "../../styles/StudentProfile.css";

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(""); 
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    major: "Computer Science",
    bio: ""
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await getUserDetails();
        setProfile(data);
        setFormData({
          username: data.username || "",
          email: data.email || "",
          major: data.major || "Computer Science",
          bio: data.bio || ""
        });
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast.error("Failed to load your profile.");
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

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      await updateUserDetails({ password: newPassword });
      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStrength("");
    } catch (error) {
      console.error("Failed to update password:", error);
      toast.error("Failed to update password.");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async () => {
    try {
      await updateUserDetails(formData);
      setProfile(prev => ({ ...prev, ...formData }));
      setEditMode(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile details.");
    }
  };

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="profile-container">
          <Sidebar role="Student" />
          <main className="main-content">
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading your profile...</p>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="profile-container">
        <Sidebar role="Student" />
        <main className="main-content">
          <div className="profile-header">
            <div>
              <h1 className="page-title">My Profile</h1>
              <p className="page-description">View and manage your personal information</p>
            </div>
            <button
              className="back-button"
              onClick={() => window.location.href = "/student-dashboard"}
            >
              <FaArrowLeft /> Back to Dashboard
            </button>
          </div>

          <div className="profile-grid">
            <div className="profile-info-card">
              <div className="card-header">
                <h2>Personal Information</h2>
                <button 
                  className={`edit-button ${editMode ? 'active' : ''}`}
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? 'Cancel Edit' : 'Edit Profile'}
                </button>
              </div>

              {editMode ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>
                      <FaUser className="input-icon" />
                      Username
                    </label>
                    <input 
                      type="text" 
                      name="username" 
                      value={formData.username} 
                      onChange={handleFormChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <FaEnvelope className="input-icon" />
                      Email
                    </label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleFormChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <FaBriefcase className="input-icon" />
                      Major
                    </label>
                    <select 
                      name="major" 
                      value={formData.major} 
                      onChange={handleFormChange}
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Business">Business</option>
                      <option value="Arts">Arts</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <FaIdCard className="input-icon" />
                      Bio
                    </label>
                    <textarea 
                      name="bio" 
                      value={formData.bio} 
                      onChange={handleFormChange}
                      rows="4"
                      placeholder="Tell us a bit about yourself..."
                    ></textarea>
                  </div>
                  
                  <button 
                    className="save-button"
                    onClick={handleProfileUpdate}
                  >
                    <FaCheckCircle /> Save Changes
                  </button>
                </div>
              ) : (
                <div className="info-display">
                  <div className="info-group">
                    <div className="info-label">
                      <FaUser className="info-icon" />
                      <span>Username</span>
                    </div>
                    <div className="info-value">{profile.username}</div>
                  </div>
                  
                  <div className="info-group">
                    <div className="info-label">
                      <FaEnvelope className="info-icon" />
                      <span>Email</span>
                    </div>
                    <div className="info-value">{profile.email}</div>
                  </div>
                  
                  <div className="info-group">
                    <div className="info-label">
                      <FaBriefcase className="info-icon" />
                      <span>Major</span>
                    </div>
                    <div className="info-value">{formData.major}</div>
                  </div>
                  
                  <div className="info-group">
                    <div className="info-label">
                      <FaCalendarAlt className="info-icon" />
                      <span>Member Since</span>
                    </div>
                    <div className="info-value">{new Date(profile.createdAt).toLocaleDateString()}</div>
                  </div>
                  
                  {formData.bio && (
                    <div className="info-group full">
                      <div className="info-label">
                        <FaIdCard className="info-icon" />
                        <span>Bio</span>
                      </div>
                      <div className="info-value bio">{formData.bio}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="password-card">
              <h2>Security Settings</h2>
              
              <div className="section-title">
                <FaShieldAlt className="section-icon" />
                <span>Change Password</span>
              </div>
              
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordStrength(checkPasswordStrength(e.target.value));
                  }}
                  placeholder="Enter new password"
                />
              </div>
              
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              
              {newPassword && (
                <div className="password-strength-meter">
                  <p>Password Strength:</p>
                  <div className="strength-bars">
                    <div className={`bar ${passwordStrength === 'Weak' ? 'weak' : ''}`}></div>
                    <div className={`bar ${passwordStrength === 'Medium' || passwordStrength === 'Strong' ? 'medium' : ''}`}></div>
                    <div className={`bar ${passwordStrength === 'Strong' ? 'strong' : ''}`}></div>
                  </div>
                  <span className={`strength-text ${passwordStrength.toLowerCase()}`}>{passwordStrength || "Not entered"}</span>
                </div>
              )}
              
              <button 
                className="change-password-btn"
                onClick={handlePasswordChange}
                disabled={!newPassword || passwordStrength === 'Weak' || newPassword !== confirmPassword}
              >
                <FaLock /> Update Password
              </button>
              
              <div className="password-requirements">
                <h4>Password Requirements:</h4>
                <ul>
                  <li className={newPassword.length >= 8 ? 'met' : ''}>At least 8 characters long</li>
                  <li className={/[A-Z]/.test(newPassword) ? 'met' : ''}>At least one uppercase letter</li>
                  <li className={/[a-z]/.test(newPassword) ? 'met' : ''}>At least one lowercase letter</li>
                  <li className={/[0-9]/.test(newPassword) ? 'met' : ''}>At least one number</li>
                  <li className={/[!@#$%^&*]/.test(newPassword) ? 'met' : ''}>At least one special character (!@#$%^&*)</li>
                </ul>
              </div>
            </div>
            
            <div className="stats-card">
              <h2>Academic Stats</h2>
              
              <div className="stat-item">
                <div className="stat-label">Courses Enrolled</div>
                <div className="stat-value">3</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-label">Completed Assignments</div>
                <div className="stat-value">12</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-label">Average Grade</div>
                <div className="stat-value">B+</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-label">Completion Rate</div>
                <div className="stat-value">85%</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default StudentProfile;