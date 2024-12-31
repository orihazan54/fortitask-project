import React from "react";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import "../../styles/Dashboard.css";

const StudentDashboard = () => {
  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Student" />
        <main className="main-content">
          <h1>Welcome, Student!</h1>
          <p>Here you can view and manage your assignments.</p>
        </main>
      </div>
    </>
  );
};

export default StudentDashboard;
