import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { getCourses, getCourseDetails } from "../../services/api";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import "../../styles/ViewStudents.css";
import { BookOpen, Users, GraduationCap, ChevronDown, Clock, Calendar } from 'lucide-react';
import "../../components/Animations.css";

const ManageStudentsAndCourses = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const { data } = await getCourses();
        setCourses(data);
        setLoading(false);
      } catch (error) {
                  toast.error("Failed to load courses.");
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleSelectCourse = async (courseId) => {
    try {
      setLoading(true);
      const { data } = await getCourseDetails(courseId);
      setSelectedCourse(data);
      setStudents(data.students || []);
      setLoading(false);
    } catch (error) {
              toast.error("Failed to load students.");
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) =>
    student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // פונקציה להצגת התאריך בפורמט מקומי
  const formatDate = (dateString) => {
    if (!dateString) return "לא זמין";
    
    try {
      const date = new Date(dateString);
      // בדיקה שהתאריך תקין
      if (isNaN(date.getTime())) return "לא זמין";
      
      // פורמט התאריך לפי הפורמט העברי המקובל
      return date.toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "לא זמין";
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Teacher" />
        <main className="main-content">
          <div className="welcome-section animate-fade-in">
            <div className="welcome-content">
              <h1 className="welcome-header">Manage Students</h1>
              <p className="welcome-description">
                View and manage students enrolled in your courses. Track their progress and provide assistance.
              </p>
            </div>
          </div>

          <div className="content-container">
            {/* Left Column: Course Selection & Details */}
            <div className="left-column">
              <div className="course-selection">
                <h3 className="section-header">
                  <BookOpen size={20} className="icon-primary" />
                  Select a Course
                </h3>
                <select
                  id="course-list"
                  className="dropdown"
                  onChange={(e) => handleSelectCourse(e.target.value)}
                  disabled={loading}
                >
                  <option value="">-- Select a Course --</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCourse && (
                <div className="course-details animate-fade-in">
                  <h3 className="section-header">
                    <GraduationCap size={20} className="icon-primary" />
                    Course Details
                  </h3>
                  <div className="info-group">
                    <div className="info-item">
                      <span className="info-label">Course Name:</span>
                      <span className="info-value">{selectedCourse.name}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Credits:</span>
                      <span className="info-value">{selectedCourse.creditPoints}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        <Calendar size={16} className="mr-1" style={{display: 'inline'}} />
                        Start Date:
                      </span>
                      <span className="info-value">
                        {formatDate(selectedCourse.deadline)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        <Users size={16} className="mr-1" style={{display: 'inline'}} />
                        Students Enrolled:
                      </span>
                      <span className="info-value">{students.length}</span>
                    </div>
                    {selectedCourse.courseDuration && (
                      <div className="info-item">
                        <span className="info-label">
                          <Clock size={16} className="mr-1" style={{display: 'inline'}} />
                          Duration:
                        </span>
                        <span className="info-value">{selectedCourse.courseDuration}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Students Table */}
            <div className="right-column">
              <div className="students-section">
                <h3 className="section-header">
                  <Users size={20} className="icon-primary" />
                  Students in Course
                </h3>

                {selectedCourse && (
                  <div className="search-container">
                    <div className="search-box">
                      <input
                        type="text"
                        className="search-input"
                        placeholder="Search students by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {loading ? (
                  <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading...</p>
                  </div>
                ) : selectedCourse ? (
                  filteredStudents.length > 0 ? (
                    <div className="table-container">
                      <table className="students-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Student Name</th>
                            <th>Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>{student.username || "N/A"}</td>
                              <td>{student.email || "N/A"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="no-students">
                      <div className="empty-state">
                        <Users size={48} className="empty-icon" />
                        <h4>No Students Found</h4>
                        <p className="empty-description">
                          {searchTerm
                            ? "No students match your search criteria."
                            : "There are no students enrolled in this course yet."}
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="no-students">
                    <div className="empty-state">
                      <ChevronDown size={48} className="empty-icon pulse" />
                      <h4>No Course Selected</h4>
                      <p className="empty-description">
                        Please select a course from the dropdown menu to view enrolled students.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManageStudentsAndCourses;