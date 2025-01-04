import axios from "axios";

// הגדרת בסיס ה-API
const API = axios.create({
  baseURL: "http://localhost:5000/api", // עדכן את ה-URL במידת הצורך
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
export const signup = (formData) => API.post("/users/signup", formData); // הרשמה
export const login = (formData) => API.post("/users/login", formData); // התחברות
export const getUserDetails = () => API.get("/users/profile"); // פרטי משתמש
export const updateUserDetails = (data) => API.put("/users/profile", data); // עדכון פרטי משתמש

// פונקציות עבור סיסמאות
export const sendPasswordResetEmail = (data) =>
  API.post("/users/forgot-password", data); // שליחת קוד לאיפוס סיסמא
export const resetPassword = (data) => API.post("/users/reset-password", data); // איפוס סיסמא

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
  }); // עדכון פרטי קורס

// פונקציה עבור קורסים של סטודנט מחובר
export const getMyCourses = () => API.get("/courses/my-courses");
