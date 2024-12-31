import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Interceptor להוספת הטוקן לכל בקשה
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// פונקציות עבור משתמשים
export const signup = (formData) => API.post("/users/signup", formData);
export const login = (formData) => API.post("/users/login", formData);
export const getUserDetails = () => API.get("/users/profile");
export const updateUserDetails = (data) => API.put("/users/profile", data);

// פונקציות עבור סיסמאות
export const sendPasswordResetEmail = (data) => API.post("/users/forgot-password", data);
export const resetPassword = (data) => API.post("/users/reset-password", data);

// פונקציות עבור משימות
export const getUserAssignments = () => API.get("/assignments/student");
export const uploadAssignment = (formData) => API.post("/assignments/upload", formData);
export const createAssignment = (data) => API.post("/assignments", data);
export const getStudentsStatus = () => API.get("/assignments/students/status");
export const getTeacherCourses = () => API.get("/courses/teacher");
export const getAllAssignments = () => API.get("/assignments");
