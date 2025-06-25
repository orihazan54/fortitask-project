import React, { useEffect, useState, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { checkAuthentication } from "./services/api";
import { Toaster } from "sonner";

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
import CourseDetails from "./pages/student/CourseDetails";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CreateCourse from "./pages/teacher/CreateCourse";
import ManageCourses from "./pages/teacher/ManageCourses";
import TeacherProfile from "./pages/teacher/TeacherProfile";
import ViewStudents from "./pages/teacher/ViewStudents";

// Loading component with fallback UI
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    <p className="ml-2">Loading...</p>
  </div>
);

// Auth Check Component with better error handling
const PrivateRoute = ({ element, requiredRole }) => {
  const { isAuthenticated, role } = checkAuthentication();
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      if (!isAuthenticated) {
        console.log("User not authenticated, redirecting to login");
        navigate("/login");
        return;
      }

      if (requiredRole && role !== requiredRole) {
        console.log(`Role mismatch: required ${requiredRole}, user has ${role}`);
        navigate(role === "Student" ? "/student-dashboard" : "/teacher-dashboard");
        return;
      }

      setIsChecking(false);
    } catch (error) {
      console.error("Error in auth check:", error);
      // Don't show error toast here to prevent duplicates
      navigate("/login");
    }
  }, [isAuthenticated, role, requiredRole, navigate]);

  if (isChecking) {
    return <Loading />;
  }

  return element;
};

// Utility function for dynamic profile routing with better error handling
const ProfilePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = checkAuthentication();

  useEffect(() => {
    try {
      if (!isAuthenticated) {
        console.log("User not authenticated, redirecting to login from profile");
        navigate("/login");
        return;
      }

      if (role === "Student") {
        navigate("/student/profile");
      } else if (role === "Teacher") {
        navigate("/teacher/profile");
      } else {
        console.log("Unknown role:", role);
        navigate("/login");
      }
    } catch (error) {
      console.error("Error in profile redirect:", error);
      navigate("/login");
    }
  }, [isAuthenticated, role, navigate]);

  return <Loading />;
};

// Fallback component for handling route errors
const ErrorBoundaryRoute = ({ element }) => {
  try {
    return element;
  } catch (error) {
    console.error("Route error:", error);
    return <Navigate to="/" />;
  }
};

const App = () => {
  return (
    <Router>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* General Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/new-password" element={<NewPassword />} />

          {/* Student Pages */}
          <Route path="/student-dashboard" element={
            <ErrorBoundaryRoute element={
              <PrivateRoute element={<StudentDashboard />} requiredRole="Student" />
            } />
          } />
          <Route path="/student/courses" element={
            <ErrorBoundaryRoute element={
              <PrivateRoute element={<StudentCourses />} requiredRole="Student" />
            } />
          } />
          <Route path="/student/profile" element={
            <ErrorBoundaryRoute element={
              <PrivateRoute element={<StudentProfile />} requiredRole="Student" />
            } />
          } />
          <Route path="/student/my-courses" element={
            <ErrorBoundaryRoute element={
              <PrivateRoute element={<MyCourses />} requiredRole="Student" />
            } />
          } />
          <Route path="/course/:courseId" element={
            <ErrorBoundaryRoute element={
              <PrivateRoute element={<CourseDetails />} requiredRole="Student" />
            } />
          } />

          {/* Teacher Pages */}
          <Route path="/teacher-dashboard" element={
            <ErrorBoundaryRoute element={
              <PrivateRoute element={<TeacherDashboard />} requiredRole="Teacher" />
            } />
          } />
          <Route path="/teacher/create-course" element={
            <ErrorBoundaryRoute element={
              <PrivateRoute element={<CreateCourse />} requiredRole="Teacher" />
            } />
          } />
          <Route path="/teacher/manage-courses" element={
            <ErrorBoundaryRoute element={
              <PrivateRoute element={<ManageCourses />} requiredRole="Teacher" />
            } />
          } />
          <Route path="/teacher/profile" element={
            <ErrorBoundaryRoute element={
              <PrivateRoute element={<TeacherProfile />} requiredRole="Teacher" />
            } />
          } />
          <Route path="/teacher/view-students" element={
            <ErrorBoundaryRoute element={
              <PrivateRoute element={<ViewStudents />} requiredRole="Teacher" />
            } />
          } />

          {/* Dynamic Profile Page */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* Root path for the application */}
          <Route path="/index" element={<Navigate to="/" />} />

          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      
      <Toaster 
        position="top-right"
        expand={true}
        richColors={true}
        closeButton={true}
        duration={4000}
        style={{
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}
      />
    </Router>
  );
};

export default App;