import React from "react";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import "../../styles/Courses.css";

const StudentCourses = () => {
  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Student" />
        <main className="main-content">
          <h1>My Courses</h1>
          <p>Here you can view your courses and related details.</p>
        </main>
      </div>
    </>
  );
};

export default StudentCourses;
