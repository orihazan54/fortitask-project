
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getCourses, registerToCourse } from "../../services/api";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { Search, GraduationCap, UserCheck, Calendar, Users, Info, ArrowLeft, Star, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import "../../styles/StudentCourses.css";

const StudentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching available courses...");
      const { data } = await getCourses();
      console.log("Available courses:", data);
      setCourses(data);
      setFilteredCourses(data);
    } catch (error) {
      console.error("Failed to load courses:", error);
      setError("Failed to load available courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSearchChange = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term === "") {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter(course => 
        course.name.toLowerCase().includes(term) || 
        (course.teacherName && course.teacherName.toLowerCase().includes(term))
      );
      setFilteredCourses(filtered);
    }
  };

  const handleSelectCourse = (courseId) => {
    const course = courses.find((c) => c._id === courseId);
    setSelectedCourse(course);
  };

  const handleRegister = async () => {
    if (!selectedCourse) {
      toast.error("Please select a course first.");
      return;
    }

    try {
      setRegistering(true);
      console.log("Registering for course:", selectedCourse._id);
      await registerToCourse(selectedCourse._id);
      toast.success("Successfully registered for the course!");
      
      // Wait a second to make sure the registration is processed before redirecting
      setTimeout(() => {
        navigate("/student/my-courses");
      }, 1000);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error.response?.data?.message || "Failed to register for the course."
      );
    } finally {
      setRegistering(false);
    }
  };

  return (
    <>
      <NavBar />
      <div className="courses-container">
        <Sidebar role="Student" />
        <main className="main-content">
          <div className="courses-header">
            <div>
              <h1 className="page-title">Available Courses</h1>
              <p className="page-description">Discover and enroll in new academic opportunities</p>
            </div>
            <div className="header-actions">
              <button
                className="refresh-btn"
                onClick={fetchCourses}
              >
                <RefreshCw size={16} />
                Refresh Courses
              </button>
              <button
                className="back-button"
                onClick={() => navigate("/student-dashboard")}
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          </div>

          {error && (
            <div className="error-banner">
              <AlertTriangle size={20} />
              <p>{error}</p>
              <button onClick={fetchCourses}>Try Again</button>
            </div>
          )}

          <div className="search-container">
            <div className="search-box">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Search courses by name or teacher..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="no-courses">
              <Info size={48} className="no-courses-icon" />
              <h3>No Courses Found</h3>
              <p>Try adjusting your search or check back later for new courses.</p>
            </div>
          ) : (
            <div className="courses-grid">
              {filteredCourses.map((course) => (
                <div 
                  key={course._id} 
                  className={`course-card ${selectedCourse?._id === course._id ? 'selected' : ''}`}
                  onClick={() => handleSelectCourse(course._id)}
                >
                  <div className="course-header">
                    <h3 className="course-title">{course.name}</h3>
                    <div className="course-credits">
                      <Star size={16} />
                      <span>{course.creditPoints} Credits</span>
                    </div>
                  </div>
                  
                  <div className="course-info">
                    <div className="info-item">
                      <UserCheck className="info-icon" size={16} />
                      <span>Instructor: {course.teacherName || "TBA"}</span>
                    </div>
                    
                    <div className="info-item">
                      <Calendar className="info-icon" size={16} />
                      <span>Deadline: {new Date(course.deadline).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="info-item">
                      <Users className="info-icon" size={16} />
                      <span>Students: {course.students?.length || 0}</span>
                    </div>
                  </div>
                  
                  <p className="course-description">
                    {course.instructions?.slice(0, 100)}
                    {course.instructions?.length > 100 ? "..." : ""}
                  </p>
                  
                  <button className="view-details-btn">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedCourse && (
            <div className="course-details-modal">
              <div className="modal-content">
                <h2 className="modal-title">{selectedCourse.name}</h2>
                
                <div className="modal-info">
                  <div className="info-group">
                    <span className="info-label">Credits:</span>
                    <span className="info-value">{selectedCourse.creditPoints}</span>
                  </div>
                  
                  <div className="info-group">
                    <span className="info-label">Instructor:</span>
                    <span className="info-value">{selectedCourse.teacherName || "TBA"}</span>
                  </div>
                  
                  <div className="info-group">
                    <span className="info-label">Deadline:</span>
                    <span className="info-value">{new Date(selectedCourse.deadline).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="info-group">
                    <span className="info-label">Students Enrolled:</span>
                    <span className="info-value">{selectedCourse.students?.length || 0}</span>
                  </div>
                </div>
                
                <div className="instructions-container">
                  <h3>Course Description & Instructions</h3>
                  <p>{selectedCourse.instructions}</p>
                </div>
                
                <div className="modal-actions">
                  <button 
                    className={`register-btn ${registering ? 'registering' : ''}`}
                    onClick={handleRegister}
                    disabled={registering}
                  >
                    {registering ? (
                      <>
                        <div className="small-spinner"></div>
                        Registering...
                      </>
                    ) : (
                      "Register for This Course"
                    )}
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => setSelectedCourse(null)}
                    disabled={registering}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default StudentCourses;