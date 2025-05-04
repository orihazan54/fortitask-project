
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getMyCourses } from "../../services/api";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { toast } from "react-toastify";
import { Search, RefreshCw, Calendar, Clock, AlertTriangle, FileText, Info, ArrowLeft } from "lucide-react";
import "../../styles/MyCourses.css";

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showToasts, setShowToasts] = useState(false); // Control toast display
  const navigate = useNavigate();

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Attempt ${retryCount + 1}: Fetching enrolled courses...`);
      const { data } = await getMyCourses();
      
      if (Array.isArray(data) && data.length > 0) {
        console.log("Enrolled courses fetched successfully:", data);
        setCourses(data);
        setFilteredCourses(data);
        setRetryCount(0);
      } else if (Array.isArray(data) && data.length === 0) {
        console.log("No enrolled courses found");
        setCourses([]);
        setFilteredCourses([]);
        setRetryCount(0);
      } else {
        console.error("Invalid data format received:", data);
        setError("Received invalid data format. Please try again.");
        
        // Only show toast if enabled (not on initial load)
        if (showToasts) {
          toast.error("Received invalid data format. Please try again.");
        }
        
        if (retryCount < 2) {
          setRetryCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error("Failed to load enrolled courses:", error);
      setError("Failed to load your courses. Please try again.");
      
      // Only show toast if enabled (not on initial load)
      if (showToasts) {
        toast.error("Failed to load your courses. Please try again.");
      }
      
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
      }
    } finally {
      setLoading(false);
      
      // Once first load is complete, enable toasts for subsequent operations
      if (!showToasts) {
        setShowToasts(true);
      }
    }
  }, [retryCount, showToasts]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Only attempt auto-retry once, and only if there's an error
  useEffect(() => {
    if (error && retryCount > 0 && retryCount <= 1) {
      const timeout = setTimeout(() => {
        console.log(`Auto-retry ${retryCount} for enrolled courses...`);
        fetchCourses();
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [retryCount, fetchCourses, error]);

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

  const navigateToCourseDetails = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const getTimeRemaining = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeRemaining = deadlineDate - now;
    
    if (timeRemaining < 0) {
      return { expired: true, text: "Expired" };
    }
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return { expired: false, text: `${days} days ${hours} hours remaining` };
    } else {
      return { expired: false, text: `${hours} hours remaining` };
    }
  };

  const countSubmittedAssignments = (course) => {
    if (!course.assignments) return 0;
    
    const userId = localStorage.getItem("userId");
    return course.assignments.filter(assignment => 
      assignment.studentId && assignment.studentId === userId
    ).length;
  };

  return (
    <>
      <NavBar />
      <div className="courses-container">
        <Sidebar role="Student" />
        <main className="main-content">
          <div className="courses-header">
            <div>
              <h1 className="page-title">My Enrolled Courses</h1>
              <p className="page-description">Manage your course progress and assignments</p>
            </div>
            <div className="header-actions">
              <button
                className="refresh-btn"
                onClick={fetchCourses}
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? "spinning" : ""} />
                {loading ? "Refreshing..." : "Refresh Courses"}
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
              <p>Loading your courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="no-courses">
              <Info size={48} className="no-courses-icon" />
              <h3>No Enrolled Courses Found</h3>
              <p>You haven't enrolled in any courses yet. Browse available courses to get started.</p>
              <button 
                className="browse-courses-btn" 
                onClick={() => navigate("/student/courses")}
              >
                Browse Available Courses
              </button>
            </div>
          ) : (
            <div className="courses-grid">
              {filteredCourses.map((course) => {
                const timeRemaining = getTimeRemaining(course.deadline);
                const submittedAssignments = countSubmittedAssignments(course);
                
                return (
                  <div key={course._id} className="course-card">
                    <div className="course-header">
                      <FileText className="course-icon" size={20} />
                      <span className={`course-status ${timeRemaining.expired ? 'missed' : 'upcoming'}`}>
                        {timeRemaining.expired ? 'Expired' : 'Active'}
                      </span>
                    </div>
                    
                    <h3 className="course-title">{course.name}</h3>
                    
                    <div className="course-info">
                      <div className="info-row">
                        <span className="info-label">Instructor:</span>
                        <span className="info-value">{course.teacherName || "Not assigned"}</span>
                      </div>
                      
                      <div className="info-row">
                        <span className="info-label">Credits:</span>
                        <span className="info-value">{course.creditPoints}</span>
                      </div>
                      
                      <div className="info-row">
                        <span className="info-label">Assignments:</span>
                        <span className="info-value">
                          {submittedAssignments} submitted / {course.assignments?.length || 0} total
                        </span>
                      </div>
                      
                      <div className="info-row deadline-row">
                        <span className="info-label">Deadline:</span>
                        <span className={`info-value ${timeRemaining.expired ? 'missed' : 'upcoming'}`}>
                          {new Date(course.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="course-metrics">
                      <div className="metric">
                        <Calendar size={16} />
                        <span>{new Date(course.deadline).toLocaleDateString()}</span>
                      </div>
                      <div className="metric">
                        <Clock size={16} />
                        <span>{timeRemaining.text}</span>
                      </div>
                    </div>
                    
                    <button 
                      className="view-course-btn"
                      onClick={() => navigateToCourseDetails(course._id)}
                    >
                      View Course Details
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default MyCourses;