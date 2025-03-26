
import React, { useState, useEffect } from "react";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { getCourses, getCourseDetails } from "../../services/api";
import { toast } from "react-toastify";
import "../../styles/TeacherDashboard.css";
import { Book, User, Calendar } from "lucide-react";

const TeacherDashboard = () => {
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalAssignments: 0
  });

  // שליפת רשימת הקורסים מהשרת
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await getCourses();
        setCourses(data);
        setStats(prev => ({...prev, totalCourses: data.length}));
        
        // חישוב סך כל התלמידים (סכום התלמידים בכל הקורסים)
        const totalStudents = data.reduce((sum, course) => 
          sum + (course.students?.length || 0), 0);
        setStats(prev => ({...prev, totalStudents}));
        
      } catch (error) {
        toast.error("❌ Failed to load courses.");
        console.error("Error fetching courses:", error);
      }
    };
    fetchCourses();
  }, []);

  // שליפת רשימת המטלות של הקורס שנבחר
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!courseId) return;
      try {
        const { data } = await getCourseDetails(courseId);
        setAssignments(data.assignments || []);
        setStats(prev => ({...prev, totalAssignments: data.assignments?.length || 0}));
      } catch (error) {
        toast.error("❌ Failed to load assignments.");
        console.error("Error fetching assignments:", error);
      }
    };
    fetchAssignments();
  }, [courseId]);

  // בחירת קורס
  const handleCourseChange = (e) => setCourseId(e.target.value);

  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Teacher" />
        <main className="main-content">
          <h2 className="dashboard-title">
            <span className="dashboard-icon">📊</span> Teacher Dashboard
          </h2>

          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-icon">
                <Book size={24} />
              </div>
              <div className="stat-content">
                <h3>{stats.totalCourses}</h3>
                <p>Total Courses</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <User size={24} />
              </div>
              <div className="stat-content">
                <h3>{stats.totalStudents}</h3>
                <p>Total Students</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <Calendar size={24} />
              </div>
              <div className="stat-content">
                <h3>{stats.totalAssignments}</h3>
                <p>Assignments</p>
              </div>
            </div>
          </div>

          {/* הצגת רשימת הקורסים */}
          <div className="courses-section">
            <h3 className="section-title">📋 Your Courses</h3>
            <select 
              value={courseId} 
              onChange={handleCourseChange} 
              className="course-select"
            >
              <option value="">-- Choose a Course --</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          {/* הצגת רשימת המטלות של הקורס שנבחר */}
          {courseId && assignments.length > 0 && (
            <div className="assignments-section">
              <h3 className="section-title">📄 Course Assignments</h3>
              <div className="assignments-table-container">
                <table className="assignments-table">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment, index) => (
                      <tr key={index}>
                        <td>{assignment.fileName}</td>
                        <td>
                          <a 
                            href={assignment.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="download-btn"
                          >
                            Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {courseId && assignments.length === 0 && (
            <div className="no-assignments">
              <p>This course doesn't have any assignments yet.</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default TeacherDashboard;