import React from "react";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import "../../styles/Courses.css";

const TeacherCourses = () => {
  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Teacher" />
        <main className="main-content">
          <h1>Manage Courses</h1>
          <p>Here you can view and manage your courses.</p>
        </main>
      </div>
    </>
  );
};

export default TeacherCourses;
