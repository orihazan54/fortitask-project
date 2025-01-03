import React, { useState, useEffect } from "react";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { getCourses } from "../../services/api";
import { toast } from "react-toastify";
import "../../styles/TeacherDashboard.css";

const TeacherDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const { data } = await getCourses();
        setCourses(data.filter((course) => course.teacherId === localStorage.getItem("userId")));
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch courses.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Teacher" />
        <main className="main-content">
          <h1>Welcome to the Teacher Dashboard!</h1>
          <section className="courses-section">
            <h2>Your Courses</h2>
            {loading ? (
              <p>Loading courses...</p>
            ) : courses.length > 0 ? (
              <table className="courses-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Course Name</th>
                    <th>Credit Points</th>
                    <th>Deadline</th>
                    <th>Students Enrolled</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course._id}>
                      <td>{course._id}</td>
                      <td>{course.name}</td>
                      <td>{course.creditPoints}</td>
                      <td>{new Date(course.deadline).toLocaleDateString()}</td>
                      <td>{course.students?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-courses">No courses found.</p>
            )}
          </section>
        </main>
      </div>
    </>
  );
};

export default TeacherDashboard;
