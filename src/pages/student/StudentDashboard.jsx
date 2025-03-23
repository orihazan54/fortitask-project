
import React, { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { getUserDetails } from "../../services/api";
import { toast } from "react-toastify";
import { FaBook, FaCalendarAlt, FaClipboardList, FaGraduationCap, FaChartLine, FaClock, FaCheckCircle } from "react-icons/fa";
import "../../styles/StudentDashboard.css";

const StudentDashboard = () => {
  const [studentName, setStudentName] = useState("Student");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentName = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const { data } = await getUserDetails(userId);
        setStudentName(data.username || "Student");
      } catch (error) {
        console.error("Failed to fetch student name:", error);
        toast.error("Failed to load student data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentName();
  }, []);

  // Mock data for the dashboard
  const dashboardData = {
    enrolledCourses: 5,
    assignments: 12,
    upcomingDeadlines: 3,
    averageGrade: 87,
    recentActivities: [
      { type: "assignment", title: "Computer Science Project", time: "3 hours ago" },
      { type: "enrollment", title: "Advanced Mathematics", time: "Yesterday" },
      { type: "grade", title: "Physics Lab Report: 92%", time: "2 days ago" }
    ],
    upcomingDeadlines: [
      { title: "Data Structures Assignment", course: "Computer Science", due: "2 days", urgent: true },
      { title: "Literature Review", course: "English Literature", due: "5 days", urgent: false },
      { title: "Final Project Proposal", course: "Engineering Principles", due: "2 weeks", urgent: false }
    ]
  };

  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Student" />
        <main className="main-content">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading your dashboard...</p>
            </div>
          ) : (
            <>
              <div className="welcome-section">
                <h1 className="welcome-header">Welcome, {studentName}!</h1>
                <p className="welcome-description">
                  Track your academic progress and manage your coursework efficiently.
                </p>
              </div>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaBook />
                  </div>
                  <div className="stat-content">
                    <h3>Enrolled Courses</h3>
                    <p className="stat-value">{dashboardData.enrolledCourses}</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaClipboardList />
                  </div>
                  <div className="stat-content">
                    <h3>Assignments</h3>
                    <p className="stat-value">{dashboardData.assignments}</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaCalendarAlt />
                  </div>
                  <div className="stat-content">
                    <h3>Upcoming Deadlines</h3>
                    <p className="stat-value">{dashboardData.upcomingDeadlines.length}</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaGraduationCap />
                  </div>
                  <div className="stat-content">
                    <h3>Average Grade</h3>
                    <p className="stat-value">{dashboardData.averageGrade}%</p>
                  </div>
                </div>
              </div>
              
              <div className="dashboard-grid">
                <div className="recent-activity-container">
                  <h2 className="section-title">Recent Activity</h2>
                  <div className="activity-list">
                    {dashboardData.recentActivities.map((activity, index) => (
                      <div className="activity-item" key={index}>
                        <div className="activity-icon">
                          {activity.type === "assignment" && <FaClipboardList />}
                          {activity.type === "enrollment" && <FaBook />}
                          {activity.type === "grade" && <FaGraduationCap />}
                        </div>
                        <div className="activity-details">
                          <h4 className="activity-title">
                            {activity.type === "assignment" && "Assignment Submitted"}
                            {activity.type === "enrollment" && "Course Enrolled"}
                            {activity.type === "grade" && "Grade Updated"}
                          </h4>
                          <p className="activity-description">{activity.title}</p>
                          <p className="activity-time">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="deadlines-container">
                  <h2 className="section-title">Upcoming Deadlines</h2>
                  <div className="deadlines-list">
                    {dashboardData.upcomingDeadlines.map((deadline, index) => (
                      <div className="deadline-item" key={index}>
                        <h4 className="deadline-title">{deadline.title}</h4>
                        <p className="deadline-course">{deadline.course}</p>
                        <div className="deadline-meta">
                          <p className={`deadline-due ${deadline.urgent ? 'urgent' : ''}`}>
                            <FaClock /> Due in {deadline.due}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="quick-actions">
                <button className="action-button">
                  <FaBook /> View All Courses
                </button>
                <button className="action-button">
                  <FaClipboardList /> Manage Assignments
                </button>
                <button className="action-button">
                  <FaChartLine /> View Progress
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default StudentDashboard;