import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getCourses, registerToCourse } from "../../services/api";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { Search, GraduationCap, UserCheck, Calendar, Users, Info, ArrowLeft, Star, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import "../../styles/StudentCourses.css";

// Advanced course discovery and registration interface with intelligent search
const StudentCourses = () => {
  // Comprehensive state management for course browsing and selection
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Dynamic course data fetching with error resilience
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

  // Initial course catalog loading on component mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Real-time search functionality with multi-field filtering
  const handleSearchChange = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    // Smart search reset or filter application
    if (term === "") {
      setFilteredCourses(courses);
    } else {
      // Multi-criteria search across course name and instructor
      const filtered = courses.filter(course => 
        course.name.toLowerCase().includes(term) || 
        (course.teacherName && course.teacherName.toLowerCase().includes(term))
      );
      setFilteredCourses(filtered);
    }
  };

  // Course selection handler for detailed view preparation
  const handleSelectCourse = (courseId) => {
    const course = courses.find((c) => c._id === courseId);
    setSelectedCourse(course);
  };

  // Secure course registration with validation and navigation
  const handleRegister = async () => {
    // Pre-registration validation
    if (!selectedCourse) {
              toast.error("Please select a course first.");
      return;
    }

    try {
      setRegistering(true);
      console.log("Registering for course:", selectedCourse._id);
      
      // Submit registration request to backend
      await registerToCourse(selectedCourse._id);
              toast.success("Successfully registered for the course!");
      
      // Smooth navigation with processing delay for better UX
      // Wait a second to make sure the registration is processed before redirecting
      setTimeout(() => {
        navigate("/student/my-courses");
      }, 1000);
    } catch (error) {
      console.error("Registration error:", error);
      // User-friendly error messaging with fallback
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
          {/* Professional header with course discovery branding */}
          <div className="courses-header">
            <div>
              <h1 className="page-title">Available Courses</h1>
              <p className="page-description">Discover and enroll in new academic opportunities</p>
            </div>
            
            {/* Action buttons for course management and navigation */}
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

          {/* Error state handling with retry functionality */}
          {error && (
            <div className="error-banner">
              <AlertTriangle size={20} />
              <p>{error}</p>
              <button onClick={fetchCourses}>Try Again</button>
            </div>
          )}

          {/* Intelligent search interface with real-time filtering */}
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

          {/* Dynamic content rendering based on data state */}
          {loading ? (
            // Professional loading indicator for better user experience
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            // Empty state with helpful messaging and guidance
            <div className="no-courses">
              <Info size={48} className="no-courses-icon" />
              <h3>No Courses Found</h3>
              <p>Try adjusting your search or check back later for new courses.</p>
            </div>
          ) : (
            // Interactive course grid with selection capabilities
            <div className="courses-grid">
              {filteredCourses.map((course) => (
                <div 
                  key={course._id} 
                  className={`course-card ${selectedCourse?._id === course._id ? 'selected' : ''}`}
                  onClick={() => handleSelectCourse(course._id)}
                >
                  {/* Course header with title and credit information */}
                  <div className="course-header">
                    <h3 className="course-title">{course.name}</h3>
                    <div className="course-credits">
                      <Star size={16} />
                      <span>{course.creditPoints} Credits</span>
                    </div>
                  </div>
                  
                  {/* Comprehensive course metadata display */}
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
                  
                  {/* Smart course description with text truncation */}
                  <p className="course-description">
                    {course.instructions?.slice(0, 100)}
                    {course.instructions?.length > 100 ? "..." : ""}
                  </p>
                  
                  {/* Interactive course exploration button */}
                  <button className="view-details-btn">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Modal for detailed course information and registration */}
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