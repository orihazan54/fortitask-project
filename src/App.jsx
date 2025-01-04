import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

// General Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import NewPassword from "./pages/NewPassword";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCourses from "./pages/student/StudentCourses";
import StudentProfile from "./pages/student/StudentProfile";
import MyCourses from "./pages/student/MyCourses";


// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CreateCourse from "./pages/teacher/CreateCourse";
import ManageCourses from "./pages/teacher/ManageCourses";
import TeacherProfile from "./pages/teacher/TeacherProfile";
import ViewStudents from "./pages/teacher/ViewStudents";

// Utility function for dynamic profile routing
const ProfilePage = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role"); // Get role from localStorage

  if (!role) {
    navigate("/login"); // Redirect to login if no role is found
    return null; // Prevent rendering
  }

  if (role === "Student") return <StudentProfile />;
  if (role === "Teacher") return <TeacherProfile />;
  return <div>Profile not found.</div>;
};

const App = () => {
  return (
    <Routes>
      {/* General Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/new-password" element={<NewPassword />} />

      {/* Student Pages */}
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/student/courses" element={<StudentCourses />} />
      <Route path="/student/profile" element={<StudentProfile />} />
      <Route path="/student/my-courses" element={<MyCourses />} />

      {/* Teacher Pages */}
      <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
      <Route path="/teacher/create-course" element={<CreateCourse />} />
      <Route path="/teacher/manage-courses" element={<ManageCourses />} />
      <Route path="/teacher/profile" element={<TeacherProfile />} />
      <Route path="/teacher/view-students" element={<ViewStudents />} />

      {/* Dynamic Profile Page */}
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
};

export default App;
