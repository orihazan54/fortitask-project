import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  User, Mail, BookOpen, Calendar, Lock, ArrowLeft,
  CheckCircle, Edit, Shield, UserCheck, Eye, EyeOff
} from "lucide-react";
import { getUserDetails, updateUserDetails, setupTwoFactorAuth, validateTwoFactorAuth, disableTwoFactorAuth } from "../../services/api";
import "../../styles/TeacherProfile.css";

// Function to format date to a readable string
function formatDate(dateString) {
  if (!dateString) return "Not available";
  return new Date(dateString).toLocaleDateString();
}

const TeacherProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Edit profile states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    username: "",
    email: ""
  });
  
  // Password change states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  
  // Two-factor authentication states
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState({
    qrCode: "",
    secret: "",
    verificationCode: "",
    enabled: false
  });
  const [processing2FA, setProcessing2FA] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState("");
  
  // Fetch user details on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await getUserDetails();
        
        if (data) {
          setUser(data);
          setProfileData({
            username: data.username || "",
            email: data.email || ""
          });
          
          // Check if 2FA is enabled
          if (data.twoFactorEnabled) {
            setTwoFactorData(prev => ({
              ...prev,
              enabled: true
            }));
          }
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load profile data. Please try again later.");
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Handle profile form field changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle profile update submission
  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      await updateUserDetails(profileData);
      
      // Refresh user data after update
      const { data } = await getUserDetails();
      setUser(data);
      
      toast.success("Profile updated successfully");
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };
  
  // Password strength checker
  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength("");
      return;
    }
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    const isLongEnough = password.length >= 8;
    
    const strength = 
      (hasUppercase ? 1 : 0) + 
      (hasLowercase ? 1 : 0) + 
      (hasNumber ? 1 : 0) + 
      (hasSpecial ? 1 : 0) + 
      (isLongEnough ? 1 : 0);
    
    if (strength < 3) {
      setPasswordStrength("weak");
    } else if (strength < 5) {
      setPasswordStrength("medium");
    } else {
      setPasswordStrength("strong");
    }
  };
  
  // Handle password change form field updates
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === "newPassword") {
      checkPasswordStrength(value);
    }
  };
  
  // Handle password update submission
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Validation checks
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    if (passwordStrength !== "strong") {
      toast.error("Please use a stronger password");
      return;
    }
    
    try {
      setLoading(true);
      await updateUserDetails({
        currentPassword: passwordData.currentPassword,
        password: passwordData.newPassword
      });
      
      toast.success("Password updated successfully");
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setPasswordStrength("");
    } catch (err) {
      console.error("Error updating password:", err);
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };
  
  // Setup 2FA
  const handleSetupTwoFactor = async () => {
    try {
      setTwoFactorError("");
      setProcessing2FA(true);
      
      // If 2FA is already enabled, open the disable screen directly
      if (twoFactorData.enabled) {
        setShowTwoFactorSetup(true);
        return;
      }
      
      const { data } = await setupTwoFactorAuth();
      
      if (!data || !data.qrCode || !data.secret) {
        throw new Error("Invalid 2FA setup data received");
      }
      
      setTwoFactorData({
        qrCode: data.qrCode,
        secret: data.secret,
        verificationCode: "",
        enabled: data.enabled || false
      });
      setShowTwoFactorSetup(true);
      console.log("2FA setup data received:", { 
        hasQR: !!data.qrCode,
        hasSecret: !!data.secret, 
        enabled: data.enabled 
      });
    } catch (error) {
      console.error("Error setting up 2FA:", error);
      toast.error("Error setting up two-factor authentication");
      setTwoFactorError(error.response?.data?.message || "Error setting up two-factor authentication");
    } finally {
      setProcessing2FA(false);
    }
  };
  
  // Verify 2FA
  const handleVerifyTwoFactor = async () => {
    try {
      setTwoFactorError("");
      
      if (!twoFactorData.verificationCode) {
        toast.error("Please enter verification code");
        setTwoFactorError("Verification code is required");
        return;
      }
      
      // Validate code format
      const code = twoFactorData.verificationCode.trim().replace(/\s+/g, '');
      if (!/^\d{6}$/.test(code)) {
        toast.error("Please enter a valid 6-digit verification code");
        setTwoFactorError("Verification code must be 6 digits");
        return;
      }
      
      setProcessing2FA(true);
      console.log("Sending verification code:", code);
      
      // Send code for verification
      await validateTwoFactorAuth(code);
      toast.success("Two-factor authentication enabled successfully");
      
      // Update local 2FA status
      setTwoFactorData(prev => ({
        ...prev,
        enabled: true,
        verificationCode: ""
      }));
      
      // Close setup screen
      setShowTwoFactorSetup(false);
      
      // Update user data from server
      const { data } = await getUserDetails();
      setUser(data);
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      const errorMessage = error.response?.data?.message || "Invalid verification code. Please try again.";
      toast.error(errorMessage);
      setTwoFactorError(errorMessage);
    } finally {
      setProcessing2FA(false);
    }
  };
  
  // Disable 2FA
  const handleDisableTwoFactor = async () => {
    try {
      setTwoFactorError("");
      
      if (!twoFactorData.verificationCode) {
        toast.error("Please enter verification code");
        setTwoFactorError("Verification code is required");
        return;
      }
      
      // Validate code format
      const code = twoFactorData.verificationCode.trim().replace(/\s+/g, '');
      if (!/^\d{6}$/.test(code)) {
        toast.error("Please enter a valid 6-digit verification code");
        setTwoFactorError("Verification code must be 6 digits");
        return;
      }
      
      setProcessing2FA(true);
      console.log("Attempting to disable 2FA with code:", code);
      
      // Call the API with the validated code
      await disableTwoFactorAuth(code);
      
      // Update UI state on success
      toast.success("Two-factor authentication disabled successfully");
      setTwoFactorData({
        qrCode: "",
        secret: "",
        verificationCode: "",
        enabled: false
      });
      setShowTwoFactorSetup(false);
      
      // Update user data to reflect the changes
      const { data } = await getUserDetails();
      setUser(data);
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      const errorMessage = error.response?.data?.message || "Error disabling two-factor authentication";
      toast.error(errorMessage);
      setTwoFactorError(errorMessage);
    } finally {
      setProcessing2FA(false);
    }
  };
  
  if (loading && !user) {
    return (
      <div className="profile-page">
        <div className="loading-spinner">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1 className="profile-title">My Profile</h1>
          <button 
            className="back-button"
            onClick={() => navigate("/teacher-dashboard")}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        
        <div className="profile-content two-columns">
          {/* Basic Info Card */}
          <div className="profile-card glass-effect">
            <div className="card-content">
              <div className="card-title">
                <User size={20} /> 
                Basic Information
              </div>
              
              <div className="profile-info-list">
                {!isEditingProfile ? (
                  <>
                    <div className="profile-info-item">
                      <div className="info-icon">
                        <User size={16} />
                      </div>
                      <div className="info-content">
                        <span className="info-label">Username</span>
                        <span className="info-value">{user?.username}</span>
                      </div>
                    </div>
                    
                    <div className="profile-info-item">
                      <div className="info-icon">
                        <Mail size={16} />
                      </div>
                      <div className="info-content">
                        <span className="info-label">Email</span>
                        <span className="info-value">{user?.email}</span>
                      </div>
                    </div>
                    
                    <div className="profile-info-item">
                      <div className="info-icon">
                        <BookOpen size={16} />
                      </div>
                      <div className="info-content">
                        <span className="info-label">Role</span>
                        <span className="info-value">{user?.role}</span>
                      </div>
                    </div>
                    
                    <div className="profile-info-item">
                      <div className="info-icon">
                        <Calendar size={16} />
                      </div>
                      <div className="info-content">
                        <span className="info-label">Joined</span>
                        <span className="info-value">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                        </span>
                    </div>
                  </div>
                  
                  <button 
                      className="action-button primary-button"
                      onClick={() => setIsEditingProfile(true)}
                      disabled={loading}
                  >
                      <Edit size={16} /> Edit Profile
                  </button>
                </>
              ) : (
                <>
                    <div className="setting-group">
                      <label className="setting-label">Username</label>
                        <input
                          type="text"
                        className="info-edit-input"
                          name="username"
                        value={profileData.username}
                        onChange={handleProfileChange}
                        />
                    </div>
                    
                    <div className="setting-group">
                      <label className="setting-label">Email</label>
                        <input
                          type="email"
                        className="info-edit-input"
                          name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                      />
                  </div>
                  
                  <div className="action-buttons">
                    <button 
                      className="action-button primary-button"
                        onClick={handleProfileUpdate}
                        disabled={loading}
                    >
                        <UserCheck size={16} /> Save Changes
                    </button>
                      
                    <button 
                      className="action-button secondary-button"
                      onClick={() => {
                          setIsEditingProfile(false);
                          setProfileData({
                          username: user?.username || "",
                          email: user?.email || ""
                        });
                      }}
                        disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
              </div>
            </div>
          </div>
          
          {/* Security Card */}
          <div className="profile-card glass-effect">
            <div className="card-content">
              <div className="card-title">
                <Shield size={20} />
                Security Settings
              </div>
              
              <div className="security-settings">
                <h3 className="mb-6">Password</h3>
                
                {!isChangingPassword ? (
                  <button 
                    className="security-button secondary-button"
                    onClick={() => setIsChangingPassword(true)}
                  >
                    <Lock size={16} /> Change Password
                  </button>
                ) : (
                  <form onSubmit={handlePasswordUpdate}>
                    <div className="password-field">
                      <label className="setting-label" htmlFor="currentPassword">Current Password</label>
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        id="currentPassword"
                        name="currentPassword"
                        className="password-input"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                      <div 
                        className="password-toggle"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </div>
                    </div>
                    
                    <div className="password-field">
                      <label className="setting-label" htmlFor="newPassword">New Password</label>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        id="newPassword"
                        name="newPassword"
                        className="password-input"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                      <div
                        className="password-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </div>
                    </div>
                    
                    {passwordData.newPassword && (
                      <div className={`password-strength ${passwordStrength}`}>
                        Password strength: {passwordStrength}
                      </div>
                    )}
                    
                    <div className="password-field">
                      <label className="setting-label" htmlFor="confirmPassword">Confirm New Password</label>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        className="password-input"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                      <div
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </div>
                    </div>
                    
                    <div className="password-requirements">
                      <h4>Password Requirements:</h4>
                      <ul className="requirement-list">
                        <li className={passwordData.newPassword?.length >= 8 ? "met" : ""}>
                          At least 8 characters
                        </li>
                        <li className={/[A-Z]/.test(passwordData.newPassword) ? "met" : ""}>
                          At least one uppercase letter
                        </li>
                        <li className={/[a-z]/.test(passwordData.newPassword) ? "met" : ""}>
                          At least one lowercase letter
                        </li>
                        <li className={/\d/.test(passwordData.newPassword) ? "met" : ""}>
                          At least one number
                        </li>
                        <li className={/[!@#$%^&*]/.test(passwordData.newPassword) ? "met" : ""}>
                          At least one special character (!@#$%^&*)
                        </li>
                      </ul>
                    </div>
                    
                    <div className="action-buttons mt-6">
                      <button
                        type="submit"
                        className="action-button primary-button"
                        disabled={
                          loading || 
                          !passwordData.currentPassword || 
                          !passwordData.newPassword || 
                          !passwordData.confirmPassword ||
                          passwordData.newPassword !== passwordData.confirmPassword ||
                          passwordStrength !== "strong"
                        }
                      >
                        <CheckCircle size={16} /> Update Password
                      </button>
                      
                      <button
                        type="button"
                        className="action-button secondary-button"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: ""
                          });
                          setPasswordStrength("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
                
                {/* Two-Factor Authentication Section */}
                <h3 className="mt-6 mb-6">Two-Factor Authentication</h3>
                
                  <div className={`twofa-status ${twoFactorData.enabled ? 'enabled' : 'disabled'}`}>
                  <Shield size={16} />
                    <span>
                      Two-factor authentication is currently 
                      <strong>{twoFactorData.enabled ? ' enabled' : ' disabled'}</strong>
                    </span>
                  </div>
                  
                  {!showTwoFactorSetup ? (
                    <button 
                    className={`security-button ${twoFactorData.enabled ? 'danger-button' : 'primary-button'}`}
                      onClick={handleSetupTwoFactor}
                      disabled={processing2FA}
                    >
                    <Shield size={16} />
                    {processing2FA ? 'Processing...' : (twoFactorData.enabled ? 'Disable 2FA' : 'Enable 2FA')}
                    </button>
                  ) : (
                  <div className="security-settings mt-3">
                    {!twoFactorData.enabled && twoFactorData.qrCode && (
                      <div className="mt-3 mb-6" style={{textAlign: 'center'}}>
                            <img 
                              src={twoFactorData.qrCode} 
                          alt="QR Code for Two-Factor Authentication"
                          style={{
                            maxWidth: '200px',
                            margin: '0 auto',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            padding: '10px',
                            backgroundColor: 'white'
                          }}
                        />
                        <p className="mt-3" style={{color: '#d1d5db', fontSize: '0.9rem'}}>
                          Scan this QR code with your authenticator app
                        </p>
                        </div>
                      )}
                      
                    <div className="setting-group mt-3">
                      <label className="setting-label" htmlFor="verificationCode">
                        {twoFactorData.enabled 
                          ? "Enter verification code to disable 2FA" 
                          : "Enter verification code from authenticator app"}
                      </label>
                      <input
                        type="text"
                        id="verificationCode"
                        className="info-edit-input"
                        value={twoFactorData.verificationCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').substring(0, 6);
                          setTwoFactorData(prev => ({
                            ...prev,
                            verificationCode: value
                          }));
                          setTwoFactorError("");
                        }}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        disabled={processing2FA}
                      />
                      
                      {twoFactorError && (
                        <div style={{color: '#ef4444', marginTop: '0.5rem', fontSize: '0.875rem'}}>
                          {twoFactorError}
                        </div>
                      )}
                    </div>
                    
                    <div className="action-buttons mt-6">
                      {twoFactorData.enabled ? (
                        <button
                          className="action-button danger-button"
                          onClick={handleDisableTwoFactor}
                          disabled={processing2FA}
                        >
                          {processing2FA ? 'Processing...' : 'Disable 2FA'}
                        </button>
                      ) : (
                          <button 
                            className="action-button primary-button"
                            onClick={handleVerifyTwoFactor}
                            disabled={processing2FA}
                          >
                          {processing2FA ? 'Verifying...' : 'Verify & Enable'}
                          </button>
                        )}
                      
                        <button 
                          className="action-button secondary-button"
                          onClick={() => {
                            setShowTwoFactorSetup(false);
                            setTwoFactorError("");
                            setTwoFactorData(prev => ({
                              ...prev,
                              verificationCode: ""
                            }));
                          }}
                          disabled={processing2FA}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
            </div>
          </div>
        </div>
        
          {/* Academic Statistics Card */}
          <div className="profile-card glass-effect" style={{ gridColumn: '1 / -1' }}>
          <div className="card-content">
              <div className="card-title">
                <BookOpen size={20} />
                Academic Information
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{
                  padding: '1.25rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#d1d5db', marginBottom: '0.5rem' }}>Enrolled Courses</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ffffff' }}>{user?.courses?.length || 0}</div>
                </div>
                
                <div style={{
                  padding: '1.25rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#d1d5db', marginBottom: '0.5rem' }}>Late Submissions</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ffffff' }}>{user?.lateSubmissions || 0}</div>
              </div>
              
                <div style={{
                  padding: '1.25rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#d1d5db', marginBottom: '0.5rem' }}>Submissions After Deadline</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ffffff' }}>{user?.submissionsModifiedAfterDeadline || 0}</div>
              </div>
              
                <div style={{
                  padding: '1.25rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#d1d5db', marginBottom: '0.5rem' }}>Last Login</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#ffffff' }}>{user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : "N/A"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;