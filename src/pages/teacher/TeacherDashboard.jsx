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

// Professional teacher dashboard with comprehensive course management and analytics
const TeacherDashboard = () => {
  // State management for course selection and dashboard metrics
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState([]);
  const [teacherName, setTeacherName] = useState("Teacher");
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalAssignments: 0
  });

  // Advanced data aggregation for teacher analytics and course overview
  // שליפת רשימת הקורסים מהשרת ופרטי המרצה
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Teacher profile information retrieval with fallback handling
        // שליפת פרטי המרצה
        const userId = localStorage.getItem("userId");
        if (userId) {
          try {
            const userResponse = await getUserDetails(userId);
            const username = userResponse.data.username || "Teacher";
            setTeacherName(username);
            console.log("Fetched teacher name:", username);
          } catch (userError) {
            console.warn("Could not fetch teacher details:", userError);
          }
        }

        // Comprehensive course data fetching with analytics calculation
        // שליפת הקורסים
        const { data } = await getCourses();
        setCourses(data);
        setStats(prev => ({...prev, totalCourses: data.length}));
        
        // Real-time student enrollment analytics across all courses
        // חישוב סך כל התלמידים (סכום התלמידים בכל הקורסים)
        const totalStudents = data.reduce((sum, course) => 
          sum + (course.students?.length || 0), 0);
        setStats(prev => ({...prev, totalStudents}));
        
        // Assignment portfolio analytics for academic workload tracking
        // חישוב סך כל המטלות (סכום המטלות בכל הקורסים)
        const totalAssignments = data.reduce((sum, course) =>
          sum + (course.assignments?.length || 0), 0);
        setStats(prev => ({...prev, totalAssignments}));
        
      } catch (error) {
        toast.error("Failed to load courses.");
        console.error("Error fetching courses:", error);
      }
    };
    fetchData();
  }, []);

  // Interactive course selection for detailed management
  // בחירת קורס
  const handleCourseClick = (id) => setCourseId(id);

  return (
    <div className="flex flex-col h-screen bg-gradient">
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Teacher" />
        <main className="main-content animate-fade-in">
          {/* Personalized welcome header with teacher identification */}
          <h2 className="dashboard-title">
            <span className="dashboard-icon">📊</span> Welcome back, {teacherName}!
          </h2>

          {/* Real-time analytics dashboard with key performance indicators */}
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

          {/* Interactive course management table with enrollment tracking */}
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
                    // Helpful empty state with course creation guidance
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