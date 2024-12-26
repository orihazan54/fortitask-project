import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const TeacherDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // לוגיקה להתנתקות (אם יש טוקן, מחיקה כאן)
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>Teacher Panel</h2>
        <ul>
          <li>Create Assignment</li>
          <li>View Students</li>
          <li>Profile</li>
        </ul>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>
      <main className="main-content">
        <h1>Welcome, Teacher!</h1>
        <p>Here you can manage your courses and assignments.</p>
      </main>
    </div>
  );
};

export default TeacherDashboard;
