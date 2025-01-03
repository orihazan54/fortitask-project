import React from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import "../../styles/StudentDashboard.css"; // נוודא שיש קובץ CSS מותאם

const StudentDashboard = () => {
  const navigate = useNavigate();

  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Student" />
        <main className="main-content">
          <div className="welcome-section animate__animated animate__fadeInDown">
            <h1 className="welcome-header">Welcome, Student!</h1>
            <p className="welcome-subtext">
              Manage your courses, track your assignments, and achieve academic success!
            </p>
          </div>
          <div className="quick-actions animate__animated animate__fadeInUp">
            <h2 className="section-header">Quick Actions</h2>
            <div className="cards-container">
              <div className="card" onClick={() => navigate("/student/courses")}>
                <h3>My Courses</h3>
                <p>View and enroll in available courses.</p>
              </div>
              <div className="card" onClick={() => navigate("/student/profile")}>
                <h3>Profile</h3>
                <p>Update your profile and manage your settings.</p>
              </div>
              <div className="card" onClick={() => navigate("/student/assignments")}>
                <h3>Assignments</h3>
                <p>Track your assignments and submit solutions.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default StudentDashboard;
