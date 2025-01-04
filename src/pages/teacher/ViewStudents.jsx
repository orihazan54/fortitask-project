import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getCourses, getCourseDetails } from "../../services/api";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import "../../styles/ViewStudents.css";

const ManageStudentsAndCourses = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);

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

  const handleSelectCourse = async (courseId) => {
    try {
      const { data } = await getCourseDetails(courseId);
      setSelectedCourse(data);
      setStudents(data.students || []); // Load students
    } catch (error) {
      toast.error("Failed to load students.");
    }
  };

  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Teacher" />
        <main className="main-content">
          <h1 className="page-header">Manage Courses & Students</h1>

          <div className="content-container">
            {/* Left Column: Course Selection & Details */}
            <div className="left-column">
              <div className="course-selection">
                <label htmlFor="course-list">Select a course:</label>
                <select
                  id="course-list"
                  className="dropdown"
                  onChange={(e) => handleSelectCourse(e.target.value)}
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
                <div className="course-details">
                  <h2 className="course-header">{selectedCourse.name}</h2>
                  <p>
                    <strong>Credits:</strong> {selectedCourse.creditPoints}
                  </p>
                  <p>
                    <strong>Students Enrolled:</strong> {students.length}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Students Table */}
            <div className="right-column">
              <h2 className="section-header">Students in Course</h2>
              {students.length > 0 ? (
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
                      {students.map((student, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{student.username}</td>
                          <td>{student.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-students">No students enrolled.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ManageStudentsAndCourses;
