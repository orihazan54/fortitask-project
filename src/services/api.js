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
export const sendPasswordResetEmail = (data) =>
  API.post("/users/forgot-password", data);
export const resetPassword = (data) => API.post("/users/reset-password", data);

// פונקציות עבור קורסים
export const getCourses = () => API.get("/courses"); // קבלת כל הקורסים
export const createCourse = (data) =>
  API.post("/courses/create", data, {
    headers: { "Content-Type": "multipart/form-data" },
  }); // יצירת קורס חדש
export const registerToCourse = (courseId) =>
  API.post(`/courses/register/${courseId}`); // הרשמה לקורס
export const getCourseDetails = (courseId) =>
  API.get(`/courses/${courseId}`); // קבלת פרטי קורס לפי מזהה
export const deleteCourse = (courseId) =>
  API.delete(`/courses/${courseId}`); // מחיקת קורס לפי מזהה
export const updateCourse = (courseId, data) =>
  API.put(`/courses/${courseId}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });