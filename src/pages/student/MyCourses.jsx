import React, { useState, useEffect } from "react";
import { getMyCourses } from "../../services/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import "../../styles/MyCourses.css";

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const { data } = await getMyCourses();
        setCourses(data); // קורסים שנרשם אליהם
      } catch (error) {
        console.error("Error fetching my courses:", error);
        toast.error("Failed to load your courses.");
      }
    };

    fetchMyCourses();
  }, []);

  const handleCourseSelection = (courseId) => {
    const course = courses.find((c) => c._id === courseId);
    setSelectedCourse(course);
  };

  return (
    <>
      <NavBar />
      <div className="my-courses-container">
        <Sidebar role="Student" />
        <main className="main-content">
          <button
            className="back-to-dashboard-btn"
            onClick={() => navigate("/student-dashboard")}
          >
            ← Back to Dashboard
          </button>
          <h2 className="header">My Courses</h2>

          {courses.length > 0 ? (
            <div className="course-selector">
              <label htmlFor="courseDropdown">Select a Course:</label>
              <select
                id="courseDropdown"
                onChange={(e) => handleCourseSelection(e.target.value)}
              >
                <option value="">-- Choose a Course --</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="no-courses">You are not enrolled in any courses.</p>
          )}

          {selectedCourse && (
            <div className="selected-course-details">
              <h3>{selectedCourse.name}</h3>
              <p>
                <strong>Credits:</strong> {selectedCourse.creditPoints}
              </p>
              <p>
                <strong>Teacher:</strong>{" "}
                {selectedCourse.teacherId?.username || "Unknown Teacher"}
              </p>
              <p>
                <strong>Deadline:</strong>{" "}
                {selectedCourse.deadline
                  ? new Date(selectedCourse.deadline).toLocaleDateString()
                  : "No deadline"}
              </p>
              <p>
                <strong>Instructions:</strong>{" "}
                {selectedCourse.instructions || "No instructions provided"}
              </p>
              {selectedCourse.fileUrl ? (
                <a
                  href={selectedCourse.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="download-link"
                >
                  Download Course Material
                </a>
              ) : (
                <p className="no-file">No course materials available</p>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default MyCourses;
