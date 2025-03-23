
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getCourses, registerToCourse } from "../../services/api";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { FaSearch, FaGraduationCap, FaUserTie, FaCalendarAlt, FaUserGraduate, FaInfoCircle } from "react-icons/fa";
import "../../styles/StudentCourses.css";

const StudentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await getCourses();
        setCourses(data);
        setFilteredCourses(data);
      } catch (error) {
        console.error("Failed to load courses:", error);
        toast.error("Failed to load available courses.");
      } finally {
        setLoading(false);
      }
    };

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
      await registerToCourse(selectedCourse._id);
      toast.success("Registered successfully to course!");
      navigate("/student/my-courses");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error.response?.data?.message || "Failed to register for the course."
      );
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
            <button
              className="back-button"
              onClick={() => navigate("/student-dashboard")}
            >
              ← Back to Dashboard
            </button>
          </div>

          <div className="search-container">
            <div className="search-box">
              <FaSearch className="search-icon" />
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
              <FaInfoCircle size={48} className="no-courses-icon" />
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
                      <FaGraduationCap />
                      <span>{course.creditPoints} Credits</span>
                    </div>
                  </div>
                  
                  <div className="course-info">
                    <div className="info-item">
                      <FaUserTie className="info-icon" />
                      <span>Instructor: {course.teacherName || "TBA"}</span>
                    </div>
                    
                    <div className="info-item">
                      <FaCalendarAlt className="info-icon" />
                      <span>Deadline: {new Date(course.deadline).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="info-item">
                      <FaUserGraduate className="info-icon" />
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
                    className="register-btn"
                    onClick={handleRegister}
                  >
                    Register for This Course
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => setSelectedCourse(null)}
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