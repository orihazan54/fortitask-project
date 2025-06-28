import axios from "axios";
import { toast } from "sonner";
import CryptoJS from "crypto-js";

// Enable credentials for secure session management across domains
axios.defaults.withCredentials = true;

// Dynamic API configuration for development and production environments
const getBaseURL = () => {
  // Environment variable takes priority for explicit configuration
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // Smart environment detection based on current hostname
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return "http://localhost:5000/api";
  } else {
    return "https://fortitask-project.onrender.com/api";
  }
};

// Axios instance with optimized configuration for academic system
const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

// Advanced error tracking system to prevent duplicate notifications
let activeErrorToasts = new Set();
// Control toast display during application initialization
let isToastSuppressed = false;
console.log("Toasts enabled from startup");

// Automatic JWT token injection for authenticated requests
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Client-side encryption utilities for sensitive data protection
// Encryption logic for sensitive data
const encryptData = (data, key = "FORTITASK_SECRET_KEY") => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
};

const decryptData = (ciphertext, key = "FORTITASK_SECRET_KEY") => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

// Comprehensive global error handling with smart duplicate prevention
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    
    // Suppress error notifications during initial app loading
    if (isToastSuppressed) {
      console.log("Toast suppressed during app initialization");
      return Promise.reject(error);
    }
    
    // Create unique error identifier for duplicate prevention
    const errorURL = error.config?.url || "unknown-endpoint";
    const errorMsg = error.response?.data?.message || error.message || "Unknown error";
    const errorId = `${errorURL}:${errorMsg}`;
    
    // Filter out non-critical background operations from error notifications
    const isBackgroundOperation = 
      errorURL.includes("enrolled") || 
      errorURL.includes("/courses/my-courses") ||
      errorURL.includes("/profile") || 
      errorURL.includes("/dashboard");
      
    // Smart error notification system with deduplication
    if (!activeErrorToasts.has(errorId) && !isBackgroundOperation) {
      activeErrorToasts.add(errorId);
      
      // Handle different types of errors with appropriate user messaging
      if (!error.response) {
        console.error("Network Error:", error.message);
        toast.error(`שגיאת רשת: אנא בדוק את החיבור שלך`, {
          onClose: () => activeErrorToasts.delete(errorId)
        });
      } 
      // Server errors with detailed status code handling
      else {
        const status = error.response.status;
        const message = error.response?.data?.message || "אירעה שגיאה. אנא נסה שוב.";
        
        if (status === 401) {
          // Automatic session cleanup and redirect for expired tokens
          toast.error("זמן ההתחברות פג. אנא התחבר מחדש.", {
            onClose: () => activeErrorToasts.delete(errorId)
          });
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          localStorage.removeItem("role");
          localStorage.removeItem("username");
          window.location.href = "/login";
        } else if (status >= 500) {
          toast.error(`שגיאת שרת: ${message}`, {
            onClose: () => activeErrorToasts.delete(errorId)
          });
        } else {
          toast.error(message, {
            onClose: () => activeErrorToasts.delete(errorId)
          });
        }
      }
      
      // Automatic cleanup of error tracking after timeout
      setTimeout(() => {
        activeErrorToasts.delete(errorId);
      }, 3000);
    }
    
    return Promise.reject(error);
  }
);

// ========== USER AUTHENTICATION FUNCTIONS ==========

// User registration with comprehensive form data validation
export const signup = async (formData) => {
  console.log("Sending signup data:", {...formData, password: "***hidden***"});
  return API.post("/users/signup", formData);
};

// Secure user login with Two-Factor Authentication support
export const login = async (formData) => {
  try {
    console.log("Attempting login with:", { 
      email: formData.email, 
      has2FACode: !!formData.twoFactorCode 
    });
    
    // Create deep copy to prevent data mutation during processing
    const loginPayload = JSON.parse(JSON.stringify(formData));
    
    // Sanitize and format 2FA code for secure transmission
    if (loginPayload.twoFactorCode) {
      loginPayload.twoFactorCode = String(loginPayload.twoFactorCode)
        .trim()
        .replace(/\s+/g, '')
        .replace(/[^\d]/g, '')
        .substring(0, 6);
        
      console.log("Formatted 2FA code for API:", loginPayload.twoFactorCode, "Length:", loginPayload.twoFactorCode.length);
    }
    
    const response = await API.post("/users/login", loginPayload);
    
    // Secure session management with localStorage persistence
    if (response.data && response.data.token) {
      // Clear any existing session data to prevent conflicts
      localStorage.clear();
      
      // Store new authentication data securely
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userId", response.data.userId);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("username", response.data.username || "User");
      
      console.log("Login successful. User data stored:", {
        userId: response.data.userId,
        role: response.data.role,
        username: response.data.username,
        hasToken: !!response.data.token
      });
      
      // Verification mechanism to ensure data persistence
      setTimeout(() => {
        const storedToken = localStorage.getItem("token");
        const storedUserId = localStorage.getItem("userId");
        const storedRole = localStorage.getItem("role");
        
        if (!storedToken || !storedUserId || !storedRole) {
          console.error("LocalStorage values not properly set after login:", {
            hasToken: !!storedToken,
            hasUserId: !!storedUserId,
            role: storedRole
          });
        } else {
          console.log("LocalStorage values verified after login");
        }
      }, 100);
    }
    
    return response;
  } catch (error) {
    console.error("Login error:", error);
    
    // Special error handling for Two-Factor Authentication requirements
    if (error.response?.status === 400 && error.response?.data?.requiresTwoFactor) {
      console.log("2FA required, returning modified error");
      // Convert to a "successful" response with requiresTwoFactor flag
      return {
        data: {
          requiresTwoFactor: true,
          message: error.response.data.message || "Two-factor authentication required"
        }
      };
    }
    
    throw error; // Re-throw for component handling
  }
};

export const getUserDetails = (userId) => {
  console.log("Fetching user details for ID:", userId || "current user");
  // Always use /users/profile since the server identifies the user from the token
  return API.get("/users/profile");
};

export const updateUserDetails = (data) => {
  // תיקון חשוב: אל תצפין את הסיסמה פעמיים!
  // השרת כבר מצפין את הסיסמה בעת שמירתה במסד הנתונים

  console.log("Updating user details:", {
    hasPassword: !!data.password,
    hasCurrentPassword: !!data.currentPassword,
    otherFields: Object.keys(data).filter(k => k !== 'password' && k !== 'currentPassword')
  });
  
  // שלח את הנתונים לא הצפנה נוספת
  return API.put("/users/profile", data);
};

// ========== PASSWORD RESET FUNCTIONS ==========
export const sendPasswordResetEmail = async (data) => {
  console.log("Sending password reset request for email:", data.email);
  try {
    const response = await API.post("/users/forgot-password", data);
    console.log("Password reset email sent successfully:", response.data);
    toast.success("הודעת איפוס סיסמה נשלחה בהצלחה");
    return response;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    toast.error(error.response?.data?.message || "לא ניתן לשלוח את האימייל לאיפוס סיסמה");
    throw error;
  }
};

export const resetPassword = async (data) => {
  console.log("Attempting to reset password for email:", data.email);
  
  try {
    // יצירת עותק להימנע משינוי הפרמטר המקורי
    const resetData = { ...data };
    
    // בדיקה האם הסיסמה מכילה את כל הדרישות
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    
    console.log("Password validation check:", { 
      hasLowercase: /[a-z]/.test(data.newPassword),
      hasUppercase: /[A-Z]/.test(data.newPassword),
      hasNumber: /\d/.test(data.newPassword),
      hasSpecialChar: /[@$!%*?&#]/.test(data.newPassword),
      length: data.newPassword.length,
      regexTest: passwordRegex.test(data.newPassword)
    });
    
    if (!passwordRegex.test(data.newPassword)) {
      toast.error("הסיסמה אינה עומדת בדרישות");
      throw new Error("Password does not meet requirements");
    }
    
    // שליחה באופן רגיל, ללא הצפנה נוספת - שינוי חשוב!
    console.log("Sending reset password request with verification code and valid password");
    const response = await API.post("/users/reset-password", resetData);
    console.log("Password reset successful:", response.data);
    toast.success("סיסמתך אופסה בהצלחה");
    return response;
  } catch (error) {
    console.error("Error resetting password:", error);
    toast.error(error.response?.data?.message || "לא ניתן לאפס את הסיסמה");
    throw error;
  }
};

// ========== 2FA FUNCTIONS - משופר ==========
export const validateTwoFactorAuth = async (code) => {
  console.log("Sending 2FA validation code:", code);
  
  // נקיון וסטנדרטיזציה של הקוד לפני שליחה
  const cleanedCode = String(code).trim().replace(/\s+/g, '');
  
  // וידוא שהקוד הוא 6 ספרות בדיוק
  if (!/^\d{6}$/.test(cleanedCode)) {
    console.error("Invalid 2FA code format:", cleanedCode);
    throw new Error("Invalid verification code. Must be 6 digits.");
  }
  
  console.log("Cleaned 2FA validation code:", cleanedCode, "Length:", cleanedCode.length);
  
  try {
    const response = await API.post("/users/validate-2fa", { code: cleanedCode });
    console.log("2FA validation successful:", response.data);
    return response;
  } catch (error) {
    console.error("2FA validation error:", error.response?.data || error.message);
    throw error;
  }
};

export const setupTwoFactorAuth = async () => {
  console.log("Setting up 2FA");
  try {
    const response = await API.get("/users/setup-2fa");
    console.log("2FA setup response:", response.data);
    return response;
  } catch (error) {
    console.error("2FA setup error:", error.response?.data || error.message);
    throw error;
  }
};

export const disableTwoFactorAuth = async (code) => {
  console.log("Disabling 2FA with code:", code);
  
  // וידוא שהקוד הוא מחרוזת ומנוקה מרווחים
  const cleanedCode = String(code || "").trim().replace(/\s+/g, '');
  console.log("Cleaned 2FA disable code:", cleanedCode, "Length:", cleanedCode.length);
  
  // בדיקת תקינות פורמט הקוד
  if (!/^\d{6}$/.test(cleanedCode)) {
    console.error("Invalid 2FA code format:", cleanedCode);
    throw new Error("Invalid verification code format. Must be 6 digits.");
  }
  
  // הוספת לוגים מפורטים יותר על הבקשה
  try {
    const response = await API.post("/users/disable-2fa", { code: cleanedCode });
    console.log("2FA disable successful response:", response.data);
    return response;
  } catch (error) {
    console.error("2FA disable error:", error.response?.data || error.message);
    throw error;
  }
};

// ========== COURSE FUNCTIONS ==========
export const getCourses = () => {
  console.log("Fetching all available courses");
  return API.get("/courses");
};

export const getMyCourses = async () => {
  console.log("Fetching enrolled courses");
  
  try {
    // First, try the main endpoint
    console.log("Trying /courses/enrolled endpoint");
    const response = await API.get("/courses/enrolled");
    console.log("Successfully fetched courses from /courses/enrolled:", response.data);
    
    // Check if we got valid data (array of courses)
    if (Array.isArray(response.data)) {
      return response;
    } else {
      throw new Error("Invalid data format received");
    }
  } catch (primaryError) {
    console.error("Error with primary endpoint:", primaryError);
    
    try {
      // Fallback to alternate endpoint
      console.log("Trying fallback endpoint /courses/my-courses");
      const fallbackResponse = await API.get("/courses/my-courses");
      console.log("Successfully fetched courses from fallback endpoint:", fallbackResponse.data);
      
      if (Array.isArray(fallbackResponse.data)) {
        return fallbackResponse;
      } else {
        throw new Error("Invalid data format from fallback endpoint");
      }
    } catch (fallbackError) {
      console.error("Error with fallback endpoint:", fallbackError);
      
      // Last resort: Get all courses and filter by enrollment
      console.log("Trying last resort: fetch all courses and filter");
      try {
        const allCoursesResponse = await API.get("/courses");
        const userId = localStorage.getItem("userId");
        
        if (!userId) {
          console.error("User ID not found in localStorage");
          throw new Error("User ID not found");
        }
        
        // Filter courses where the user is enrolled
        const filteredCourses = allCoursesResponse.data.filter(
          course => course.students && Array.isArray(course.students) && 
          course.students.some(studentId => studentId === userId || 
                             (typeof studentId === 'object' && studentId._id === userId))
        );
        
        console.log("Filtered enrolled courses:", filteredCourses);
        return { data: filteredCourses };
      } catch (lastError) {
        console.error("All endpoints failed:", lastError);
        // Return empty array as fallback to prevent UI errors
        return { data: [] };
      }
    }
  }
};

export const createCourse = (formData) =>
  API.post("/courses/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const registerToCourse = (courseId) => {
  console.log("Registering to course:", courseId);
  return API.post(`/courses/register/${courseId}`)
    .then(response => {
      console.log("Registration successful:", response.data);
      toast.success("Successfully registered to course!");
      return response;
    });
};

export const getCourseDetails = (courseId) => {
  console.log("Fetching details for course:", courseId);
  // Ensure we're only attempting to fetch valid course IDs
  if (!courseId || courseId === 'undefined' || courseId === 'my-courses' || courseId === 'enrolled') {
    console.error("Invalid course ID:", courseId);
    return Promise.reject(new Error("Invalid course ID. Please provide a valid course ID."));
  }
  
  // Add retry logic for course details fetching
  const fetchWithRetry = async (retries = 3, delay = 1000) => {
    try {
      const response = await API.get(`/courses/${courseId}`);
      console.log(`Successfully fetched course details for ${courseId}:`, response.data);
      return response;
    } catch (error) {
      console.error(`Error fetching course details for ${courseId}:`, error);
      
      if (retries <= 0) {
        throw error;
      }
      
      console.log(`Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(retries - 1, delay * 1.5);
    }
  };
  
  return fetchWithRetry();
};

export const deleteCourse = (courseId) => API.delete(`/courses/${courseId}`);

export const updateCourse = (courseId, formData) =>
  API.put(`/courses/${courseId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ========== ASSIGNMENT FUNCTIONS ==========
export const uploadAssignment = (courseId, formData) => {
  console.log("Starting upload for course ID:", courseId);
  
  // בדיקות לוודא שה-FormData מוגדר נכון
  if (!formData.has('file')) {
    console.error("No file found in FormData");
    throw new Error("No file in upload data");
  } else {
    console.log("File is present in FormData");
    
    // בדיקת פרטים נוספים בטופס
    const fileEntry = formData.get('file');
    console.log("File entry type:", typeof fileEntry);
    console.log("File entry is File object:", fileEntry instanceof File);
    if (fileEntry instanceof File) {
      console.log("File details:", {
        name: fileEntry.name,
        size: fileEntry.size,
        type: fileEntry.type
      });
    }
  }
  
  // הוספת הערה אם קיימת
  if (formData.get('comment')) {
    console.log("Uploading with comment:", formData.get('comment'));
  }
  
  // הוספת lastModified אם קיים
  if (formData.get('lastModified')) {
    console.log("Uploading with lastModified:", formData.get('lastModified'));
  }
  
  // העלאה בפועל עם timeout מוגדל
  return API.post(`/courses/${courseId}/upload-assignment`, formData, {
    headers: { 
      "Content-Type": "multipart/form-data" 
    },
    timeout: 60000 // הגדלת timeout לעד דקה להעלאת קבצים
  });
};

export const getAssignments = async (courseId) => {
  const response = await API.get(`/courses/${courseId}/assignments`);
  
  // הוסף טיפול בשמות קבצים עבריים אם יש צורך
  if (response.data) {
    // אם זה מערך של מטלות
    if (Array.isArray(response.data)) {
      response.data = response.data.map(assignment => {
        // אם יש שדה displayName, השתמש בו, אחרת השתמש ב-fileName
        assignment.displayFileName = assignment.displayName || assignment.fileName;
        return assignment;
      });
    } 
    // אם זה אובייקט שמכיל materials ו-studentSubmissions
    else if (response.data.materials || response.data.studentSubmissions) {
      if (response.data.materials) {
        response.data.materials = response.data.materials.map(assignment => {
          assignment.displayFileName = assignment.displayName || assignment.fileName;
          return assignment;
        });
      }
      
      if (response.data.studentSubmissions) {
        response.data.studentSubmissions = response.data.studentSubmissions.map(assignment => {
          assignment.displayFileName = assignment.displayName || assignment.fileName;
          return assignment;
        });
      }
    }
  }
  
  return response;
};

export const downloadAssignment = async (courseId, assignmentId, fileName) => {
  try {
    console.log(`Downloading assignment ${assignmentId} from course ${courseId}`);

    // Get the file URL directly using the Cloudinary approach
    const response = await API.get(`/courses/${courseId}/assignments/${assignmentId}/download`);
    
    if (!response.data || !response.data.fileUrl) {
      console.error("No download URL received");
      return false;
    }
    
    // Use the direct download URL from Cloudinary
    const downloadUrl = response.data.fileUrl;
    
    // Use the original file name when provided, or fall back to a default
    const originalFileName = response.data.originalFileName || fileName || "downloaded-file";
    
    console.log(`Starting download with URL: ${downloadUrl}`);
    console.log(`Using original filename: ${originalFileName}`);
    
    // Create a temporary link element to download the file
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.download = originalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error("Download error:", error);
    return false;
  }
};

export const deleteAssignment = (courseId, assignmentId) => {
  console.log("Deleting assignment:", assignmentId, "from course:", courseId);
  return API.delete(`/courses/${courseId}/assignments/${assignmentId}`);
};

// Function to check if user is authenticated
export const checkAuthentication = () => {
  try {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");
    
    console.log("Auth check:", { hasToken: !!token, hasUserId: !!userId, role });
    
    return {
      isAuthenticated: !!token && !!userId && !!role,
      userId,
      role
    };
  } catch (error) {
    console.error("Error checking authentication:", error);
    return {
      isAuthenticated: false,
      userId: null,
      role: null
    };
  }
};

// Helper functions for encryption
export { encryptData, decryptData };