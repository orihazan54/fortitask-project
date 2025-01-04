import React, { useState, useEffect } from "react";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { getUserDetails } from "../../services/api";
import { toast } from "react-toastify";
import "../../styles/TeacherDashboard.css";

const TeacherDashboard = () => {
  const [teacherName, setTeacherName] = useState("");

  useEffect(() => {
    // שליפת שם המשתמש מהשרת
    const fetchTeacherName = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const { data } = await getUserDetails(userId);
        setTeacherName(data.username || "Teacher");
      } catch (error) {
        console.error("Failed to fetch teacher name:", error);
        toast.error("Failed to load teacher's name.");
      }
    };

    fetchTeacherName();
  }, []);

  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Teacher" />
        <main className="main-content">
          <div className="welcome-section">
            <h1 className="welcome-header">Welcome, {teacherName}!</h1>
            <p className="welcome-description">
              This is your teacher's dashboard. Use the panel on the left to manage your courses,
              track student progress, and create new learning opportunities.
            </p>
          </div>
          <div className="info-section">
            <p className="info-text">
              Fortitask is your ultimate tool to simplify course management and enhance student
              engagement. Dive in and explore the features designed to make your teaching
              experience seamless and efficient.
            </p>
          </div>
        </main>
      </div>
    </>
  );
};

export default TeacherDashboard;
