import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// הוספת טוקן לכל בקשה
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("⚠️ No token found in localStorage!");
  }
  return req;
});

// 🔹 פונקציות עבור משתמשים
export const signup = (formData) => API.post("/users/signup", formData);
export const login = (formData) => API.post("/users/login", formData);
export const getUserDetails = () => API.get("/users/profile"); // תוקן ✅
export const updateUserDetails = (data) => API.put("/users/profile", data);

// 🔹 פונקציות עבור איפוס סיסמה (תוקן ✅)
export const sendPasswordResetEmail = (data) => API.post("/users/forgot-password", data);
export const resetPassword = (data) => API.post("/users/reset-password", data);

// 🔹 פונקציות עבור קורסים
export const getCourses = () => API.get("/courses");
export const createCourse = (data) =>
  API.post("/courses/create", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const registerToCourse = (courseId) => API.post(`/courses/register/${courseId}`);
export const getCourseDetails = (courseId) => API.get(`/courses/${courseId}`);
export const deleteCourse = (courseId) => API.delete(`/courses/${courseId}`);
export const updateCourse = (courseId, data) =>
  API.put(`/courses/${courseId}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getMyCourses = () => API.get("/courses/my-courses");

// 🔹 פונקציות עבור מטלות
export const uploadAssignment = (courseId, formData) =>
  API.post(`/courses/${courseId}/upload-assignment`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getAssignments = (courseId) => API.get(`/courses/${courseId}/assignments`);

export const downloadAssignment = (fileUrl) => window.open(fileUrl, "_blank");
