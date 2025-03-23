import React, { useState, useEffect } from "react";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { getCourses, getCourseDetails } from "../../services/api";
import { toast } from "react-toastify";
import "../../styles/TeacherDashboard.css";

const TeacherDashboard = () => {
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // שליפת רשימת הקורסים מהשרת
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await getCourses();
        setCourses(data);
      } catch (error) {
        toast.error("❌ Failed to load courses.");
        console.error("Error fetching courses:", error);
      }
    };
    fetchCourses();
  }, []);

  // שליפת רשימת המטלות של הקורס שנבחר
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!courseId) return;
      try {
        const { data } = await getCourseDetails(courseId);
        setAssignments(data.assignments || []);
      } catch (error) {
        toast.error("❌ Failed to load assignments.");
        console.error("Error fetching assignments:", error);
      }
    };
    fetchAssignments();
  }, [courseId]);

  // בחירת קורס
  const handleCourseChange = (e) => setCourseId(e.target.value);

  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Teacher" />
        <main className="main-content">
          <h2 className="dashboard-title">📚 Teacher Dashboard</h2>

          {/* הצגת רשימת הקורסים */}
          <div className="courses-list">
            <h3>📋 Your Courses</h3>
            <select value={courseId} onChange={handleCourseChange} className="course-select">
              <option value="">-- Choose a Course --</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          {/* הצגת רשימת המטלות של הקורס שנבחר */}
          {courseId && assignments.length > 0 && (
            <div className="assignments-list">
              <h3>📄 Uploaded Assignments</h3>
              <ul>
                {assignments.map((assignment, index) => (
                  <li key={index}>
                    {assignment.fileName}{" "}
                    <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer">
                      📥 Download
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default TeacherDashboard;
