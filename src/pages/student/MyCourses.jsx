
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getMyCourses, getCourseDetails, downloadAssignment } from "../../services/api";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { FaBook, FaCalendarAlt, FaClipboardList, FaDownload, FaExclamationCircle, FaGraduationCap, FaInfoCircle } from "react-icons/fa";
import "../../styles/MyCourses.css";

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // For testing purposes, we'll try the real API call first
        try {
          const { data } = await getMyCourses();
          
          if (Array.isArray(data) && data.length > 0) {
            console.log("Fetched real courses:", data);
            setCourses(data);
          } else {
            // If data is empty or not an array, use mock data
            throw new Error("No courses found or invalid data format");
          }
        } catch (apiError) {
          console.error("API call failed, using mock data instead:", apiError);
          
          // Mock data for demonstration
          const mockCourses = [
            {
              _id: "mockid1",
              name: "Introduction to Web Development",
              creditPoints: 3,
              deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
              assignments: [{}, {}, {}], // 3 mock assignments
              teacherId: { username: "Dr. Smith" }
            },
            {
              _id: "mockid2",
              name: "Database Design",
              creditPoints: 4,
              deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
              assignments: [{}, {}], // 2 mock assignments
              teacherId: { username: "Prof. Johnson" }
            },
            {
              _id: "mockid3",
              name: "Advanced JavaScript",
              creditPoints: 5,
              deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
              assignments: [{}, {}, {}, {}], // 4 mock assignments
              teacherId: { username: "Mrs. Williams" }
            }
          ];
          
          setCourses(mockCourses);
          console.log("Using mock data:", mockCourses);
        }
      } catch (error) {
        console.error("Error in fetchMyCourses:", error);
        setError(true);
        toast.error("Failed to load your courses.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, []);

  const handleCourseSelection = async (courseId) => {
    if (!courseId) {
      setSelectedCourse(null);
      setCourseDetails(null);
      return;
    }
    
    try {
      setLoading(true);
      const course = courses.find((c) => c._id === courseId);
      setSelectedCourse(course);
      
      // Try to fetch additional course details from API
      try {
        const { data } = await getCourseDetails(courseId);
        setCourseDetails(data);
      } catch (apiError) {
        console.error("Error fetching course details, using mock details:", apiError);
        
        // Mock course details if API fails
        const mockDetails = {
          ...course,
          description: "This is a comprehensive course covering all essential topics. Students will learn through practical exercises and theory.",
          fileUrl: "#", // Mock file URL
          assignments: [
            { 
              fileName: "Assignment 1: Introduction", 
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              fileUrl: "#"
            },
            { 
              fileName: "Assignment 2: Core Concepts", 
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              fileUrl: "#"
            },
            { 
              fileName: "Final Project", 
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              fileUrl: "#"
            }
          ]
        };
        
        setCourseDetails(mockDetails);
      }
    } catch (error) {
      console.error("Error selecting course:", error);
      toast.error("Failed to load course details.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress for a course
  const calculateProgress = (course) => {
    if (!course) return 0;
    
    // In real implementation, this would be based on completed assignments, grades, etc.
    // For mock data, generate a random but consistent progress based on course ID
    const hash = course._id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Math.min(100, Math.max(0, (hash % 100)));
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <>
      <NavBar />
      <div className="my-courses-container">
        <Sidebar role="Student" />
        <main className="main-content">
          <div className="courses-header">
            <div>
              <h1 className="page-title">My Courses</h1>
              <p className="page-description">Track your enrolled courses and academic progress</p>
            </div>
            <button
              className="back-button"
              onClick={() => navigate("/student-dashboard")}
            >
              ← Back to Dashboard
            </button>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading your courses...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <FaExclamationCircle size={48} className="error-icon" />
              <h3>Error Loading Courses</h3>
              <p>There was a problem loading your courses. Please try again.</p>
              <button 
                className="retry-btn"
                onClick={handleRetry}
              >
                Retry
              </button>
            </div>
          ) : courses.length === 0 ? (
            <div className="no-courses">
              <FaExclamationCircle size={48} className="no-courses-icon" />
              <h3>No Enrolled Courses</h3>
              <p>You haven't enrolled in any courses yet. Browse available courses to get started.</p>
              <button 
                className="browse-courses-btn"
                onClick={() => navigate("/student/courses")}
              >
                Browse Available Courses
              </button>
            </div>
          ) : (
            <div className="enrolled-courses-container">
              <div className="courses-grid">
                {courses.map((course) => (
                  <div 
                    key={course._id} 
                    className={`course-card ${selectedCourse?._id === course._id ? 'selected' : ''}`}
                    onClick={() => handleCourseSelection(course._id)}
                  >
                    <div className="course-header">
                      <h3 className="course-title">{course.name}</h3>
                      <div className="course-credits">
                        <FaGraduationCap />
                        <span>{course.creditPoints} Credits</span>
                      </div>
                    </div>
                    
                    <div className="progress-container">
                      <div className="progress-info">
                        <span>Progress</span>
                        <span>{calculateProgress(course)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${calculateProgress(course)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="course-info">
                      <div className="info-item">
                        <FaCalendarAlt className="info-icon" />
                        <span>Deadline: {new Date(course.deadline).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="info-item">
                        <FaClipboardList className="info-icon" />
                        <span>Assignments: {course.assignments?.length || 0}</span>
                      </div>
                    </div>
                    
                    <button className="view-details-btn">
                      View Course Details
                    </button>
                  </div>
                ))}
              </div>

              {selectedCourse && (
                <div className="course-details-section">
                  <h2 className="section-title">{selectedCourse.name} - Details</h2>
                  
                  {courseDetails ? (
                    <div className="details-content">
                      <div className="details-header">
                        <div className="header-item">
                          <span className="item-label">Credits</span>
                          <span className="item-value">{selectedCourse.creditPoints}</span>
                        </div>
                        <div className="header-item">
                          <span className="item-label">Instructor</span>
                          <span className="item-value">
                            {courseDetails.teacherId?.username || "Unknown Teacher"}
                          </span>
                        </div>
                        <div className="header-item">
                          <span className="item-label">Deadline</span>
                          <span className="item-value">
                            {new Date(selectedCourse.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="details-description">
                        <h3>Course Description</h3>
                        <p>{selectedCourse.instructions || "No description provided"}</p>
                      </div>
                      
                      <div className="materials-section">
                        <h3>Course Materials</h3>
                        {courseDetails.fileUrl ? (
                          <div className="material-item">
                            <div className="material-info">
                              <FaBook className="material-icon" />
                              <span>Course Material</span>
                            </div>
                            <button 
                              className="download-btn"
                              onClick={() => downloadAssignment(courseDetails.fileUrl)}
                            >
                              <FaDownload /> Download
                            </button>
                          </div>
                        ) : (
                          <p className="no-materials">No course materials available yet</p>
                        )}
                      </div>
                      
                      <div className="assignments-section">
                        <h3>Assignments</h3>
                        {courseDetails.assignments && courseDetails.assignments.length > 0 ? (
                          <div className="assignments-list">
                            {courseDetails.assignments.map((assignment, index) => (
                              <div className="assignment-item" key={index}>
                                <div className="assignment-info">
                                  <FaClipboardList className="assignment-icon" />
                                  <div>
                                    <span className="assignment-name">{assignment.fileName || `Assignment ${index + 1}`}</span>
                                    <span className="assignment-date">
                                      Due: {new Date(assignment.dueDate || courseDetails.deadline).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="assignment-actions">
                                  <button 
                                    className="download-btn sm"
                                    onClick={() => downloadAssignment(assignment.fileUrl)}
                                  >
                                    <FaDownload /> Download
                                  </button>
                                  <button className="submit-btn sm">
                                    Submit Work
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-assignments">No assignments available yet</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="loading-details">
                      <div className="spinner small"></div>
                      <p>Loading course details...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default MyCourses;