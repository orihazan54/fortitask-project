import React, { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { getUserDetails } from "../../services/api";
import { toast } from "react-toastify";
import "../../styles/StudentDashboard.css";

const StudentDashboard = () => {
  const [studentName, setStudentName] = useState("Student");

  useEffect(() => {
    const fetchStudentName = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const { data } = await getUserDetails(userId);
        setStudentName(data.username || "Student");
      } catch (error) {
        console.error("Failed to fetch student name:", error);
        toast.error("Failed to load student name.");
      }
    };

    fetchStudentName();
  }, []);

  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Student" />
        <main className="main-content">
          <div className="welcome-section">
            <h1 className="welcome-header">Welcome, {studentName}!</h1>
            <p className="welcome-description">
              Access your courses, view uploaded materials, and track your academic progress.
            </p>
          </div>
          <div className="info-section">
            <p className="info-text">
              Explore the available courses, stay up-to-date with deadlines, and make the most out of your studies using Fortitask.
            </p>
          </div>
        </main>
      </div>
    </>
  );
};

export default StudentDashboard;
