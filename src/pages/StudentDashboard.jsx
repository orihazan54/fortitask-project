import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const StudentDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // לוגיקה להתנתקות (אם יש טוקן, מחיקה כאן)
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>Student Panel</h2>
        <ul>
          <li>View Assignments</li>
          <li>Submit Assignment</li>
          <li>Profile</li>
        </ul>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>
      <main className="main-content">
        <h1>Welcome, Student!</h1>
        <p>Here you can view and manage your assignments.</p>
      </main>
    </div>
  );
};

export default StudentDashboard;
