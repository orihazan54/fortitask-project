import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  User, Mail, BookOpen, Calendar, Lock, Award, ArrowLeft,
  Clock, AlertTriangle, CheckCircle, Edit, Shield
} from "lucide-react";
import { getUserDetails, updateUserDetails, setupTwoFactorAuth, validateTwoFactorAuth, disableTwoFactorAuth } from "../../services/api";
import "../../styles/StudentProfile.css";

// Card components from shadcn UI
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter 
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";

// Function to format date to a readable string
function formatDate(dateString) {
  if (!dateString) return "Not available";
  return new Date(dateString).toLocaleDateString();
}

// Function to add days to a date and return a new date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const StudentProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    completedAssignments: 0,
    lateSubmissions: 0,
    totalCreditPoints: 0
  });
  
  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordStrength, setPasswordStrength] = useState("");
  
  // 2FA states
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState({
    qrCode: "",
    secret: "",
    verificationCode: "",
    enabled: false
  });
  
  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Get user profile data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        console.log("🔍 Fetching user profile...");
        const { data } = await getUserDetails();
        console.log("✅ Profile data received:", data);
        
        if (data) {
          setUser(data);
          
          // Use actual enrolled courses if available, otherwise empty array
          const enrolledCourses = data.courses || [];
          setCourses(enrolledCourses);
          
          // Calculate real stats from user data
          setStats({
            coursesEnrolled: enrolledCourses.length,
            completedAssignments: data.completedAssignments || 0,
            lateSubmissions: data.lateSubmissions || 0,
            totalCreditPoints: calculateTotalCredits(enrolledCourses)
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
  }, [navigate]);
  
  // Calculate total credit points from actual courses
  const calculateTotalCredits = (courses = []) => {
    return courses.reduce((total, course) => {
      // Use actual credit points from the course if available, or default to 3
      return total + (course.creditPoints || 3);
    }, 0);
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
    
    if (name === "newPassword") {
      checkPasswordStrength(value);
    }
  };
  
  // Submit password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match!");
      return;
    }
    
    if (passwordStrength !== "strong") {
      toast.error("Please use a stronger password!");
      return;
    }
    
    try {
      await updateUserDetails({ password: passwordData.newPassword });
      toast.success("Password updated successfully!");
      setShowPasswordChange(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password. Please try again.");
    }
  };
  
  // Setup 2FA
  const handleSetupTwoFactor = async () => {
    try {
      console.log("Setting up 2FA...");
      const { data } = await setupTwoFactorAuth();
      console.log("2FA setup response:", data);
      
      setTwoFactorData({
        qrCode: data.qrCode,
        secret: data.secret,
        verificationCode: "",
        enabled: data.enabled || false
      });
      setShowTwoFactorSetup(true);
    } catch (error) {
      console.error("Error setting up 2FA:", error);
      toast.error("Failed to setup two-factor authentication. Please try again.");
    }
  };
  
  // Verify 2FA
  const handleVerifyTwoFactor = async () => {
    try {
      if (!twoFactorData.verificationCode) {
        toast.error("Please enter verification code");
        return;
      }
      
      console.log("Verifying 2FA code:", twoFactorData.verificationCode);
      await validateTwoFactorAuth(twoFactorData.verificationCode);
      toast.success("Two-factor authentication enabled successfully!");
      setTwoFactorData(prev => ({
        ...prev,
        enabled: true
      }));
      setShowTwoFactorSetup(false);
      
      // Update user data
      const { data } = await getUserDetails();
      setUser(data);
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      toast.error("Invalid verification code. Please try again.");
    }
  };
  
  // Disable 2FA
  const handleDisableTwoFactor = async () => {
    try {
      if (!twoFactorData.verificationCode) {
        toast.error("Please enter verification code");
        return;
      }
      
      console.log("Disabling 2FA with code:", twoFactorData.verificationCode);
      await disableTwoFactorAuth(twoFactorData.verificationCode);
      toast.success("Two-factor authentication disabled successfully!");
      setTwoFactorData({
        qrCode: "",
        secret: "",
        verificationCode: "",
        enabled: false
      });
      setShowTwoFactorSetup(false);
      
      // Update user data
      const { data } = await getUserDetails();
      setUser(data);
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      toast.error("Invalid verification code. Please try again.");
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2">Loading profile...</p>
      </div>
    );
  }

  // Generate upcoming deadlines based on the actual enrolled courses
  const upcomingDeadlines = courses.slice(0, 3).map((course, index) => {
    // Create realistic deadline dates
    const today = new Date();
    let deadline;
    
    if (index === 0) {
      deadline = addDays(today, 2); // First deadline in 2 days
    } else if (index === 1) {
      deadline = addDays(today, 7); // Second deadline in 1 week
    } else {
      deadline = addDays(today, 21); // Third deadline in 3 weeks
    }
    
    return {
      ...course,
      deadline: deadline,
      remaining: index === 0 ? '2 days left' : index === 1 ? '1 week left' : '3 weeks left',
      status: index === 0 ? 'urgent' : index === 1 ? 'soon' : ''
    };
  });

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="profile-title">My Profile</h1>
        <button 
          className="back-button"
          onClick={() => navigate("/student-dashboard")}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </div>
      
      <div className="profile-grid">
        {/* Personal Information Card */}
        <Card className="profile-card">
          <CardHeader>
            <CardTitle className="card-title">
              <User className="inline-block mr-2" size={20} />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                  <span className="info-label">Student Status</span>
                  <span className="info-value">Active</span>
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
          </CardContent>
          <CardFooter>
            <Button 
              className="primary-button"
              onClick={() => toast.info("Profile editing will be available soon.")}
            >
              <Edit size={16} />
              Edit Profile
            </Button>
          </CardFooter>
        </Card>
        
        {/* Academic Stats Card */}
        <Card className="profile-card">
          <CardHeader>
            <CardTitle className="card-title">
              <Award className="inline-block mr-2" size={20} />
              Academic Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="courses-stats">
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-value">{stats.coursesEnrolled}</span>
                  <span className="stat-label">Courses Enrolled</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.totalCreditPoints}</span>
                  <span className="stat-label">Total Credits</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.completedAssignments}</span>
                  <span className="stat-label">Completed Assignments</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.lateSubmissions}</span>
                  <span className="stat-label">Late Submissions</span>
                </div>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">Upcoming Deadlines</h3>
            <div className="deadline-list">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((deadline, index) => (
                  <div 
                    key={index} 
                    className={`deadline-item ${deadline.status}`}
                  >
                    <div className="deadline-info">
                      <span className="deadline-course">{deadline.name || `Course ${index + 1}`}</span>
                      <span className="deadline-date">
                        <Clock size={14} />
                        {formatDate(deadline.deadline)}
                      </span>
                    </div>
                    <span className={`deadline-remaining ${deadline.status}`}>
                      {deadline.remaining}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">No upcoming deadlines</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Security Settings Card */}
        <Card className="profile-card">
          <CardHeader>
            <CardTitle className="card-title">
              <Lock className="inline-block mr-2" size={20} />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showPasswordChange ? (
              <div className="security-settings">
                <Button 
                  className="w-full mb-4"
                  onClick={() => setShowPasswordChange(true)}
                >
                  <Lock size={16} className="mr-2" />
                  Change Password
                </Button>
                
                <div className="twofa-section">
                  <div className={`twofa-status ${twoFactorData.enabled ? 'enabled' : 'disabled'}`}>
                    <Shield size={20} />
                    <span>
                      Two-Factor Authentication is currently 
                      <strong>{twoFactorData.enabled ? ' enabled' : ' disabled'}</strong>
                    </span>
                  </div>
                  
                  {!showTwoFactorSetup ? (
                    <Button 
                      className={`w-full ${twoFactorData.enabled ? 'secondary-button' : 'primary-button'}`}
                      onClick={handleSetupTwoFactor}
                    >
                      <Shield size={16} className="mr-2" />
                      {twoFactorData.enabled ? 'Disable 2FA' : 'Enable 2FA'}
                    </Button>
                  ) : (
                    <div className="mt-4">
                      {!twoFactorData.enabled && (
                        <div className="qrcode-container">
                          {twoFactorData.qrCode && (
                            <img 
                              src={twoFactorData.qrCode} 
                              alt="QR Code for 2FA" 
                              className="qrcode-image"
                            />
                          )}
                          <p className="qrcode-help">
                            Scan this QR code with your authenticator app 
                            (like Google Authenticator or Authy) and enter the 
                            verification code below.
                          </p>
                        </div>
                      )}
                      
                      <input
                        type="text"
                        placeholder="Enter verification code"
                        className="verification-input"
                        value={twoFactorData.verificationCode}
                        onChange={(e) => setTwoFactorData(prev => ({
                          ...prev,
                          verificationCode: e.target.value
                        }))}
                      />
                      
                      <div className="action-buttons">
                        {!twoFactorData.enabled ? (
                          <>
                            <Button 
                              className="primary-button flex-1"
                              onClick={handleVerifyTwoFactor}
                            >
                              <CheckCircle size={16} />
                              Verify & Enable
                            </Button>
                            <Button 
                              className="secondary-button flex-1"
                              onClick={() => setShowTwoFactorSetup(false)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              className="danger-button flex-1"
                              onClick={handleDisableTwoFactor}
                            >
                              <Shield size={16} />
                              Disable 2FA
                            </Button>
                            <Button 
                              className="secondary-button flex-1"
                              onClick={() => setShowTwoFactorSetup(false)}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="security-settings">
                <div className="setting-group">
                  <label className="setting-label">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    className="password-input"
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div className="setting-group">
                  <label className="setting-label">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    className="password-input"
                    placeholder="Enter new password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  {passwordStrength && (
                    <span className={`password-strength ${passwordStrength}`}>
                      Password strength: {passwordStrength}
                    </span>
                  )}
                </div>
                
                <div className="setting-group">
                  <label className="setting-label">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="password-input"
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div className="action-buttons">
                  <Button 
                    type="submit"
                    className="primary-button flex-1"
                    disabled={
                      !passwordData.currentPassword || 
                      !passwordData.newPassword || 
                      !passwordData.confirmPassword ||
                      passwordStrength !== "strong"
                    }
                  >
                    <CheckCircle size={16} />
                    Update Password
                  </Button>
                  <Button 
                    type="button"
                    className="secondary-button flex-1"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: ""
                      });
                      setPasswordStrength("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">Password Requirements:</h4>
                  <ul className="list-disc pl-5 text-sm text-gray-600">
                    <li className={passwordData.newPassword?.length >= 8 ? "text-green-600" : ""}>
                      At least 8 characters long
                    </li>
                    <li className={/[A-Z]/.test(passwordData.newPassword) ? "text-green-600" : ""}>
                      At least one uppercase letter
                    </li>
                    <li className={/[a-z]/.test(passwordData.newPassword) ? "text-green-600" : ""}>
                      At least one lowercase letter
                    </li>
                    <li className={/[0-9]/.test(passwordData.newPassword) ? "text-green-600" : ""}>
                      At least one number
                    </li>
                    <li className={/[!@#$%^&*]/.test(passwordData.newPassword) ? "text-green-600" : ""}>
                      At least one special character (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              </form>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="danger-button w-full"
              onClick={() => setShowDeleteModal(true)}
            >
              <AlertTriangle size={16} className="mr-2" />
              Delete Account
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h2 className="modal-title">
              <AlertTriangle size={20} className="inline-block mr-2" />
              Delete Account
            </h2>
            <p className="modal-message">
              Are you sure you want to delete your account? This action cannot be undone, and all your data will be permanently lost.
            </p>
            <div className="modal-buttons">
              <Button 
                className="secondary-button"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className="danger-button"
                onClick={() => {
                  toast.info("Account deletion is currently disabled for demo purposes.");
                  setShowDeleteModal(false);
                }}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
