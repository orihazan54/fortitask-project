
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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Edit profile states
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: "",
    email: ""
  });
  
  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  
  // 2FA states
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState({
    qrCode: "",
    secret: "",
    verificationCode: "",
    enabled: false
  });
  
  // מצב עבור בקשות 2FA בתהליך
  const [processing2FA, setProcessing2FA] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState("");
  
  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Get user profile data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const { data } = await getUserDetails();
        
        if (data) {
          setUser(data);
          
          // Setup edit data with user values
          setEditData({
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
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load profile data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Handle edit profile form change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Submit profile edits
  const handleProfileSubmit = async () => {
    try {
      setLoading(true);
      await updateUserDetails(editData);
      
      toast.success("Profile details updated successfully!");
      
      // Update user data after successful edit
      const { data } = await getUserDetails();
      setUser(data);
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile details. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Check password strength
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
    
    // Log all validation checks for debugging
    console.log("Password validation checks:", {
      uppercase: hasUppercase,
      lowercase: hasLowercase,
      number: hasNumber,
      special: hasSpecial,
      length: isLongEnough,
      value: password.length
    });
    
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
  
  // Handle password change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear previous error when user is typing
    if (name === "currentPassword") {
      setPasswordError("");
    }
    
    if (name === "newPassword") {
      checkPasswordStrength(value);
    }
  };
  
  // Submit password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    
    // Validate passwords
    if (!passwordData.currentPassword) {
      setPasswordError("Current password is required");
      toast.error("Current password is required");
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      toast.error("New passwords do not match!");
      return;
    }
    
    if (passwordStrength !== "strong") {
      setPasswordError("Please use a stronger password");
      toast.error("Please use a stronger password!");
      return;
    }
    
    try {
      setLoading(true);
      
      console.log("Attempting to update password with values that meet all criteria");
      
      // Send password data directly without encryption (api service will handle it)
      const response = await updateUserDetails({ 
        password: passwordData.newPassword,
        currentPassword: passwordData.currentPassword 
      });
      
      console.log("Password update response:", response);
      
      toast.success("Password updated successfully!");
      setShowPasswordChange(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setPasswordStrength("");
      setPasswordError("");
    } catch (error) {
      console.error("Error updating password:", error);
      const errorMessage = error.response?.data?.message || "Failed to update password. Please try again.";
      setPasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Setup 2FA - משופר עם בדיקות
  const handleSetupTwoFactor = async () => {
    try {
      setTwoFactorError("");
      setProcessing2FA(true);
      
      // אם 2FA כבר מופעל, פתח את מסך הכיבוי ישירות
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
      toast.error("שגיאה בהגדרת אימות דו-שלבי. אנא נסה שנית.");
      setTwoFactorError(error.response?.data?.message || "שגיאה בהגדרת אימות דו-שלבי");
    } finally {
      setProcessing2FA(false);
    }
  };
  
  // Verify 2FA - משופר על בסיס קוד שעובד
  const handleVerifyTwoFactor = async () => {
    try {
      setTwoFactorError("");
      
      if (!twoFactorData.verificationCode) {
        toast.error("אנא הכנס קוד אימות");
        setTwoFactorError("קוד אימות נדרש");
        return;
      }
      
      // בדיקת תקינות פורמט הקוד
      const code = twoFactorData.verificationCode.trim().replace(/\s+/g, '');
      if (!/^\d{6}$/.test(code)) {
        toast.error("אנא הכנס קוד אימות תקין בן 6 ספרות");
        setTwoFactorError("קוד אימות חייב להכיל 6 ספרות בדיוק");
        return;
      }
      
      setProcessing2FA(true);
      console.log("Sending verification code:", code);
      
      // שליחת הקוד לאימות
      await validateTwoFactorAuth(code);
      toast.success("אימות דו-שלבי הופעל בהצלחה!");
      
      // עדכון סטטוס ה-2FA במקומי
      setTwoFactorData(prev => ({
        ...prev,
        enabled: true,
        verificationCode: ""
      }));
      
      // סגירת מסך ההגדרה
      setShowTwoFactorSetup(false);
      
      // עדכון נתוני המשתמש מהשרת
      const { data } = await getUserDetails();
      setUser(data);
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      const errorMessage = error.response?.data?.message || "קוד אימות שגוי. אנא נסה שנית.";
      toast.error(errorMessage);
      setTwoFactorError(errorMessage);
    } finally {
      setProcessing2FA(false);
    }
  };
  
  // Disable 2FA - משופר על בסיס קוד שעובד
  const handleDisableTwoFactor = async () => {
    try {
      setTwoFactorError("");
      
      if (!twoFactorData.verificationCode) {
        toast.error("אנא הכנס קוד אימות");
        setTwoFactorError("קוד אימות נדרש");
        return;
      }
      
      // בדיקת תקינות פורמט הקוד
      const code = twoFactorData.verificationCode.trim().replace(/\s+/g, '');
      if (!/^\d{6}$/.test(code)) {
        toast.error("אנא הכנס קוד אימות תקין בן 6 ספרות");
        setTwoFactorError("קוד אימות חייב להכיל 6 ספרות בדיוק");
        return;
      }
      
      // Set loading state while disabling
      setProcessing2FA(true);
      
      console.log("Attempting to disable 2FA with code:", code);
      
      // Call the API with the validated code
      await disableTwoFactorAuth(code);
      
      // Update UI state on success
      toast.success("אימות דו-שלבי בוטל בהצלחה!");
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
      const errorMsg = error.response?.data?.message || "שגיאה בביטול אימות דו-שלבי. אנא נסה שנית.";
      toast.error(errorMsg);
      setTwoFactorError(errorMsg);
    } finally {
      setProcessing2FA(false);
    }
  };
  
  // Delete account
  const handleDeleteAccount = async () => {
    try {
      // For demonstration purposes, account deletion is disabled
      toast.info("Account deletion is currently disabled for demonstration purposes.");
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please try again.");
    }
  };

  // Show loading state
  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e1b4b]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2 text-white">Loading profile...</p>
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
            <ArrowLeft size={18} />
            Back
          </button>
        </div>
        
        <div className="profile-content two-columns">
          {/* Personal Information Card */}
          <div className="profile-card">
            <div className="card-content">
              <h2 className="card-title">
                <User className="text-blue-400" size={20} />
                Personal Information
              </h2>
              
              {!isEditing ? (
                <>
                  <div className="profile-info-list">
                    <div className="profile-info-item">
                      <div className="info-icon">
                        <User size={20} />
                      </div>
                      <div className="info-content">
                        <span className="info-label">Username</span>
                        <span className="info-value">{user?.username || "Not set"}</span>
                      </div>
                    </div>
                    
                    <div className="profile-info-item">
                      <div className="info-icon">
                        <Mail size={20} />
                      </div>
                      <div className="info-content">
                        <span className="info-label">Email</span>
                        <span className="info-value">{user?.email || "Not set"}</span>
                      </div>
                    </div>
                    
                    <div className="profile-info-item">
                      <div className="info-icon">
                        <BookOpen size={20} />
                      </div>
                      <div className="info-content">
                        <span className="info-label">Role</span>
                        <span className="info-value">{user?.role || "Not set"}</span>
                      </div>
                    </div>
                    
                    <div className="profile-info-item">
                      <div className="info-icon">
                        <Calendar size={20} />
                      </div>
                      <div className="info-content">
                        <span className="info-label">Member Since</span>
                        <span className="info-value">{formatDate(user?.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    className="action-button primary-button mt-6"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit size={16} />
                    Edit Profile
                  </button>
                </>
              ) : (
                <>
                  <div className="profile-info-list">
                    <div className="profile-info-item">
                      <div className="info-icon">
                        <User size={20} />
                      </div>
                      <div className="info-content">
                        <span className="info-label">Username</span>
                        <input
                          type="text"
                          name="username"
                          className="info-edit-input"
                          value={editData.username}
                          onChange={handleEditChange}
                        />
                      </div>
                    </div>
                    
                    <div className="profile-info-item">
                      <div className="info-icon">
                        <Mail size={20} />
                      </div>
                      <div className="info-content">
                        <span className="info-label">Email</span>
                        <input
                          type="email"
                          name="email"
                          className="info-edit-input"
                          value={editData.email}
                          onChange={handleEditChange}
                        />
                      </div>
                    </div>
                    
                    <div className="profile-info-item">
                      <div className="info-icon">
                        <BookOpen size={20} />
                      </div>
                      <div className="info-content">
                        <span className="info-label">Role</span>
                        <span className="info-value">{user?.role || "Not set"}</span>
                      </div>
                    </div>
                    
                    <div className="profile-info-item">
                      <div className="info-icon">
                        <Calendar size={20} />
                      </div>
                      <div className="info-content">
                        <span className="info-label">Member Since</span>
                        <span className="info-value">{formatDate(user?.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="action-buttons">
                    <button 
                      className="action-button primary-button"
                      onClick={handleProfileSubmit}
                    >
                      <UserCheck size={16} />
                      Save Changes
                    </button>
                    <button 
                      className="action-button secondary-button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditData({
                          username: user?.username || "",
                          email: user?.email || ""
                        });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Security Settings Card - MOVED TWO-FACTOR HERE */}
          <div className="profile-card">
            <div className="card-content">
              <h2 className="card-title">
                <Shield className="text-blue-400" size={20} />
                Security Settings
              </h2>
              
              <div className="security-settings mb-6">
                <div className="mt-4">
                  <div className={`twofa-status ${twoFactorData.enabled ? 'enabled' : 'disabled'}`}>
                    <Shield size={20} />
                    <span>
                      Two-factor authentication is currently 
                      <strong>{twoFactorData.enabled ? ' enabled' : ' disabled'}</strong>
                    </span>
                  </div>
                  
                  {!showTwoFactorSetup ? (
                    <button 
                      className={`security-button ${twoFactorData.enabled ? 'danger-button' : 'primary-button'} mt-3`}
                      onClick={handleSetupTwoFactor}
                      disabled={processing2FA}
                    >
                      <Shield size={16} className="mr-2" />
                      {processing2FA ? 'Processing...' : 
                        (twoFactorData.enabled ? 'Disable Two-Factor Auth' : 'Enable Two-Factor Auth')}
                    </button>
                  ) : (
                    <div className="mt-4">
                      {!twoFactorData.enabled && (
                        <div className="flex justify-center mb-4">
                          {twoFactorData.qrCode ? (
                            <img 
                              src={twoFactorData.qrCode} 
                              alt="QR Code for 2FA" 
                              className="w-48 h-48 mb-2"
                            />
                          ) : (
                            <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500">Loading QR code...</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="text-center mb-4 text-sm text-gray-300">
                        {!twoFactorData.enabled ? (
                          <p>Scan the QR code with your authenticator app and enter the verification code below.</p>
                        ) : (
                          <p>Enter the verification code from your authenticator app to disable two-factor authentication.</p>
                        )}
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Enter verification code"
                        className="password-input text-center tracking-wider"
                        value={twoFactorData.verificationCode}
                        onChange={(e) => {
                          // מסנן רק ספרות ומגביל לאורך 6
                          const value = e.target.value.replace(/\D/g, '').substring(0, 6);
                          setTwoFactorData(prev => ({
                            ...prev,
                            verificationCode: value
                          }));
                          setTwoFactorError("");
                        }}
                        aria-label="Verification Code"
                        disabled={processing2FA}
                        dir="ltr"
                      />
                      
                      {twoFactorError && (
                        <div className="mt-2 p-2 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm text-center">
                          {twoFactorError}
                        </div>
                      )}
                      
                      <div className="action-buttons">
                        {!twoFactorData.enabled ? (
                          <button 
                            className="action-button primary-button"
                            onClick={handleVerifyTwoFactor}
                            disabled={processing2FA}
                          >
                            {processing2FA ? 'Verifying...' : (
                              <>
                                <CheckCircle size={16} />
                                Verify and Enable
                              </>
                            )}
                          </button>
                        ) : (
                          <button 
                            className="action-button danger-button"
                            onClick={handleDisableTwoFactor}
                            disabled={processing2FA}
                          >
                            {processing2FA ? 'Disabling...' : (
                              <>
                                <Shield size={16} />
                                Disable Two-Factor Auth
                              </>
                            )}
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
                
                <button 
                  className="security-button danger-button mt-6"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={processing2FA}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Password Change Card */}
        <div className="profile-card mt-6">
          <div className="card-content">
            <h2 className="card-title">
              <Lock className="text-blue-400" size={20} />
              Change Password
            </h2>
            
            <form onSubmit={handlePasswordSubmit} className="security-settings">
              <div className="setting-group">
                <label className="setting-label" htmlFor="current-password">Current Password</label>
                <div className="password-field relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    id="current-password"
                    className={`password-input ${passwordError && !passwordData.currentPassword ? 'border-red-500' : ''}`}
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="setting-group">
                <label className="setting-label" htmlFor="new-password">New Password</label>
                <div className="password-field relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    id="new-password"
                    className="password-input"
                    placeholder="Enter new password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordStrength && (
                  <span className={`password-strength ${passwordStrength}`}>
                    Password Strength: {passwordStrength === 'weak' ? 'Week' : passwordStrength === 'medium' ? 'Medium' : 'Strong'}
                  </span>
                )}
              </div>
              
              <div className="setting-group">
                <label className="setting-label" htmlFor="confirm-password">Confirm New Password</label>
                <div className="password-field relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    id="confirm-password"
                    className="password-input"
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              {passwordError && (
                <div className="mt-2 p-2 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
                  {passwordError}
                </div>
              )}
              
              <div className="password-requirements">
                <h4 className="font-semibold text-sm mb-2">Password Requirements:</h4>
                <ul className="requirement-list" aria-label="Password requirements">
                  <li className={passwordData.newPassword?.length >= 8 ? "met" : ""}>
                    At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(passwordData.newPassword) ? "met" : ""}>
                    At least one uppercase letter
                  </li>
                  <li className={/[a-z]/.test(passwordData.newPassword) ? "met" : ""}>
                    At least one lowercase letter
                  </li>
                  <li className={/[0-9]/.test(passwordData.newPassword) ? "met" : ""}>
                    At least one number
                  </li>
                  <li className={/[!@#$%^&*]/.test(passwordData.newPassword) ? "met" : ""}>
                    At least one special character (!@#$%^&*)
                  </li>
                </ul>
              </div>
              
              <div className="action-buttons">
                <button 
                  type="submit"
                  className="action-button primary-button"
                  disabled={
                    !passwordData.currentPassword || 
                    !passwordData.newPassword || 
                    !passwordData.confirmPassword ||
                    passwordStrength !== "strong" ||
                    loading
                  }
                >
                  {loading ? 'Updating...' : <><CheckCircle size={16} /> Update Password</>}
                </button>
                <button 
                  type="button"
                  className="action-button secondary-button"
                  onClick={() => {
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: ""
                    });
                    setPasswordStrength("");
                    setPasswordError("");
                  }}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div className="confirmation-modal" role="dialog" aria-labelledby="delete-account-title" aria-modal="true">
            <div className="modal-content">
              <h2 className="modal-title" id="delete-account-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Delete Account
              </h2>
              <p className="modal-message">
                Are you sure you want to delete your account? This action cannot be undone, and all your data will be permanently deleted.
              </p>
              <div className="modal-buttons">
                <button 
                  className="action-button secondary-button"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="action-button danger-button"
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherProfile;