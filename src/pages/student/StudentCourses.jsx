import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getCourses, registerToCourse } from "../../services/api";
import NavBar from "../../components/NavBar";
import "../../styles/StudentCourses.css";

const StudentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await getCourses();
        setCourses(data);
      } catch (error) {
        toast.error("Failed to load courses.");
      }
    };

    fetchCourses();
  }, []);

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
      toast.success("Registered successfully!");
      navigate("/student-dashboard");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to register for the course."
      );
    }
  };

  return (
    <>
      <NavBar />
      <div className="student-courses-container">
        <div className="header-section">
          <h2 className="header">Explore Available Courses</h2>
          <button
            className="btn back-btn"
            onClick={() => navigate("/student-dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="course-selection">
          <label htmlFor="course-list" className="select-label">
            Select a course:
          </label>
          <select
            id="course-list"
            className="course-select"
            value={selectedCourse?._id || ""}
            onChange={(e) => handleSelectCourse(e.target.value)}
          >
            <option value="" disabled>
              -- Select a course --
            </option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCourse && (
          <div className="course-details">
            <h3>Course Details</h3>
            <div className="course-info">
              <p>
                <strong>Course Name:</strong> {selectedCourse.name}
              </p>
              <p>
                <strong>Credits:</strong> {selectedCourse.creditPoints}
              </p>
              <p>
                <strong>Deadline:</strong>{" "}
                {new Date(selectedCourse.deadline).toLocaleDateString()}
              </p>
              <p>
                <strong>Instructions:</strong> {selectedCourse.instructions}
              </p>
              <p>
                <strong>Teacher:</strong> {selectedCourse.teacherName || "N/A"}
              </p>
              <p>
                <strong>Students Enrolled:</strong>{" "}
                {selectedCourse.students?.length || 0}
              </p>
            </div>
            <button className="btn register-btn" onClick={handleRegister}>
              Register
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default StudentCourses;
