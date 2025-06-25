import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getUserDetails, getCourses } from "../../services/api";
import NavBar from "../../components/NavBar";
import { toast } from "sonner";
import { 
  BookOpen, Users, Calendar, Clock, 
  GraduationCap, PlusCircle, Settings, 
  ChevronRight, BarChart3, Eye, FileText
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import "../../styles/TeacherDashboard.css";

const TeacherDashboard = () => {
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState([]);
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
        
        // חישוב סך כל המטלות (סכום המטלות בכל הקורסים)
        const totalAssignments = data.reduce((sum, course) =>
          sum + (course.assignments?.length || 0), 0);
        setStats(prev => ({...prev, totalAssignments}));
        
      } catch (error) {
        toast.error("Failed to load courses.");
        console.error("Error fetching courses:", error);
      }
    };
    fetchCourses();
  }, []);

  // בחירת קורס
  const handleCourseClick = (id) => setCourseId(id);

  return (
    <div className="flex flex-col h-screen bg-gradient">
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Teacher" />
        <main className="main-content animate-fade-in">
          <h2 className="dashboard-title">
            <span className="dashboard-icon">📊</span> Teacher Dashboard
          </h2>

          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-icon">
                <BookOpen size={24} />
              </div>
              <div className="stat-content">
                <h3>{stats.totalCourses}</h3>
                <p>Total Courses</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <Users size={24} />
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

          {/* הצגת רשימת הקורסים כטבלה */}
          <div className="courses-section">
            <h3 className="section-title">
              <FileText className="section-icon" size={20} /> Your Courses
            </h3>
            
            <div className="courses-table-container">
              <table className="courses-table">
                <thead>
                  <tr>
                    <th>Course Name</th>
                    <th>Enrolled Students</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <tr 
                        key={course._id}
                        className={courseId === course._id ? "selected-row" : ""}
                        onClick={() => handleCourseClick(course._id)}
                      >
                        <td>{course.name}</td>
                        <td>{course.students?.length || 0}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="no-courses">
                        <p>No courses available. Create your first course to get started.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;