import axios from "axios";
import { toast } from "sonner";
import CryptoJS from "crypto-js";

// Create the API instance with better timeout settings
const API = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

// Track active error toasts to prevent duplicates
let activeErrorToasts = new Set();
// Track toast display activity
let isToastSuppressed = true;
// Enable toasts after app is loaded and running for a few seconds
setTimeout(() => {
  isToastSuppressed = false;
  console.log("Toasts enabled");
}, 5000);

// Add token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Encryption logic for sensitive data
const encryptData = (data, key = "FORTITASK_SECRET_KEY") => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
};

const decryptData = (ciphertext, key = "FORTITASK_SECRET_KEY") => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

// Improved global error handling with duplicate prevention
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    
    // Don't show toasts during initial app loading
    if (isToastSuppressed) {
      console.log("Toast suppressed during app initialization");
      return Promise.reject(error);
    }
    
    // Generate a unique error ID based on the error message and URL
    const errorURL = error.config?.url || "unknown-endpoint";
    const errorMsg = error.response?.data?.message || error.message || "Unknown error";
    const errorId = `${errorURL}:${errorMsg}`;
    
    // Skip toast for non-critical background operations
    const isBackgroundOperation = 
      errorURL.includes("enrolled") || 
      errorURL.includes("/courses/my-courses") ||
      errorURL.includes("/profile") || 
      errorURL.includes("/dashboard");
      
    // Only show toast if this exact error isn't already being shown
    // and if it's not a background operation
    if (!activeErrorToasts.has(errorId) && !isBackgroundOperation) {
      activeErrorToasts.add(errorId);
      
      // Network errors
      if (!error.response) {
        console.error("Network Error:", error.message);
        toast.error(`Network error: Please check your connection.`, {
          onClose: () => activeErrorToasts.delete(errorId)
        });
      } 
      // Server errors
      else {
        const status = error.response.status;
        const message = error.response?.data?.message || "An error occurred. Please try again.";
        
        if (status === 401) {
          // Session expired or unauthorized
          toast.error("Session expired. Please log in again.", {
            onClose: () => activeErrorToasts.delete(errorId)
          });
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          localStorage.removeItem("role");
          localStorage.removeItem("username");
          window.location.href = "/login";
        } else if (status >= 500) {
          toast.error(`Server error: ${message}`, {
            onClose: () => activeErrorToasts.delete(errorId)
          });
        } else {
          toast.error(message, {
            onClose: () => activeErrorToasts.delete(errorId)
          });
        }
      }
      
      // Automatically remove from tracking after 3 seconds
      setTimeout(() => {
        activeErrorToasts.delete(errorId);
      }, 3000);
    }
    
    return Promise.reject(error);
  }
);

// ========== USER FUNCTIONS ==========
export const signup = async (formData) => {
  console.log("Sending signup data:", {...formData, password: "***hidden***"});
  return API.post("/users/signup", formData);
};

export const login = async (formData) => {
  try {
    console.log("Attempting login with:", { 
      email: formData.email, 
      has2FACode: !!formData.twoFactorCode 
    });
    
    // Create a deep copy of formData to avoid mutations
    const loginPayload = JSON.parse(JSON.stringify(formData));
    
    // Make sure twoFactorCode is properly formatted if present
    if (loginPayload.twoFactorCode) {
      // Ensure twoFactorCode is a string, trimmed, only digits, and without spaces
      loginPayload.twoFactorCode = String(loginPayload.twoFactorCode)
        .trim()
        .replace(/\s+/g, '')
        .replace(/[^\d]/g, '')
        .substring(0, 6);
        
      console.log("Formatted 2FA code for API:", loginPayload.twoFactorCode, "Length:", loginPayload.twoFactorCode.length);
    }
    
    const response = await API.post("/users/login", loginPayload);
    
    // Store user data in localStorage immediately after successful login
    if (response.data && response.data.token) {
      // First clear any existing data to avoid conflicts
      localStorage.clear();
      
      // Set the new values
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
      
      // Double check after a short delay that everything was properly set
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
    
    // Special handling for 2FA requirement
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
  console.log("Fetching user details for ID:", userId);
  if (userId) {
    return API.get(`/users/profile/${userId}`);
  }
  return API.get("/users/profile");
};

export const updateUserDetails = (data) => {
  if (data.password) {
    data = {
      ...data,
      password: encryptData(data.password)
    };
  }
  return API.put("/users/profile", data);
};

// ========== PASSWORD RESET FUNCTIONS ==========
export const sendPasswordResetEmail = async (data) => {
  console.log("Sending password reset request for email:", data.email);
  try {
    const response = await API.post("/users/forgot-password", data);
    console.log("Password reset email sent successfully:", response.data);
    return response;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

export const resetPassword = async (data) => {
  console.log("Attempting to reset password for email:", data.email);
  
  try {
    // Make sure we're sending the properly encrypted password
    const secureData = {
      ...data,
      newPassword: encryptData(data.newPassword)
    };
    
    console.log("Sending reset password request with verification code length:", data.verificationCode.length);
    const response = await API.post("/users/reset-password", secureData);
    console.log("Password reset successful:", response.data);
    return response;
  } catch (error) {
    console.error("Error resetting password:", error);
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
  
  // DO NOT add problematic metadata fields like lastModified or lastModifiedUTC
  // Let the server handle these values instead
  
  // Add any comment if provided
  if (formData.get('comment')) {
    console.log("Uploading with comment:", formData.get('comment'));
  }
  
  // העלאה בפועל עם timeout מוגדל
  return API.post(`/courses/${courseId}/upload-assignment`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 30000 // Increased timeout for file uploads
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

export const downloadAssignment = (fileUrl, fileName) => {
  console.log("Downloading file from URL:", fileUrl);
  
  if (!fileUrl) {
    console.error("Invalid file URL provided");
    toast.error("Download link not available");
    return false;
  }
  
  try {
    // Open file in new tab
    window.open(fileUrl, "_blank");
    
    // Show a toast with proper file name
    toast.success(`Downloading: ${fileName || 'File'}`);
    return true;
  } catch (error) {
    console.error("Error downloading file:", error);
    toast.error("Failed to download file");
    return false;
  }
};

export const deleteAssignment = (courseId, assignmentId) => {
  console.log("Deleting assignment:", assignmentId, "from course:", courseId);
  return API.delete(`/courses/${courseId}/assignments/${assignmentId}`);
};

// ========== SECURITY FUNCTIONS ==========
export const validateTwoFactorAuth = (code) => {
  console.log("Sending 2FA validation code:", code);
  return API.post("/users/validate-2fa", { code });
};

export const setupTwoFactorAuth = () => {
  console.log("Setting up 2FA");
  return API.get("/users/setup-2fa");
};

export const disableTwoFactorAuth = (code) => {
  console.log("Disabling 2FA with code:", code);
  
  // Make sure the code is a string, properly formatted
  const cleanedCode = String(code).trim().replace(/\s+/g, '');
  console.log("Cleaned 2FA disable code:", cleanedCode, "Length:", cleanedCode.length);
  
  // Add more detailed logging about the request
  return API.post("/users/disable-2fa", { code: cleanedCode })
    .then(response => {
      console.log("2FA disable successful response:", response.data);
      return response;
    })
    .catch(error => {
      console.error("2FA disable error:", error.response?.data || error.message);
      throw error;
    });
};

export const deleteAccount = () => API.delete("/users/account");

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