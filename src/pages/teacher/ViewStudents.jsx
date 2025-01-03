import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getCourseDetails } from "../../services/api"; // שים לב לפונקציה הנכונה
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import "../../styles/ViewStudents.css";

const ViewStudents = ({ courseId }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const { data } = await getCourseDetails(courseId); // קבלת פרטי הקורס כולל הסטודנטים
        setStudents(data.students || []); // שמירת רשימת הסטודנטים מהקורס
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch students.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [courseId]);

  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Teacher" />
        <main className="main-content">
          <h1>Students in Course</h1>
          {loading ? (
            <p>Loading students...</p>
          ) : students.length > 0 ? (
            <table className="students-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student ID</th>
                </tr>
              </thead>
              <tbody>
                {students.map((studentId, index) => (
                  <tr key={studentId}>
                    <td>{index + 1}</td>
                    <td>{studentId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-students">No students registered for this course.</p>
          )}
        </main>
      </div>
    </>
  );
};

export default ViewStudents;
