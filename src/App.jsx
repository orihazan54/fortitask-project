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
import ViewAssignments from "./pages/student/ViewAssignments";
import SubmitAssignment from "./pages/student/SubmitAssignment";
import StudentCourses from "./pages/student/StudentCourses";
import StudentProfile from "./pages/student/StudentProfile";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CreateAssignment from "./pages/teacher/CreateAssignment";
import ViewStudents from "./pages/teacher/ViewStudents";
import TeacherCourses from "./pages/teacher/TeacherCourses";
import TeacherProfile from "./pages/teacher/TeacherProfile";

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
      <Route path="/student/view-assignments" element={<ViewAssignments />} />
      <Route path="/student/submit-assignment" element={<SubmitAssignment />} />
      <Route path="/student/courses" element={<StudentCourses />} />
      <Route path="/student/profile" element={<StudentProfile />} />

      {/* Teacher Pages */}
      <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
      <Route path="/teacher/create-assignment" element={<CreateAssignment />} />
      <Route path="/teacher/view-students" element={<ViewStudents />} />
      <Route path="/teacher/courses" element={<TeacherCourses />} />
      <Route path="/teacher/profile" element={<TeacherProfile />} />

      {/* Dynamic Profile Page */}
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
};

export default App;
