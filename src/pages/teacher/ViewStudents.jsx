import React, { useState, useEffect } from "react";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import "../../styles/ViewStudents.css";
import { getStudentsStatus } from "../../services/api";

const ViewStudents = () => {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data } = await getStudentsStatus();
        setStudents(data);
      } catch (error) {
        console.error("Error fetching student statuses:", error);
      }
    };
    fetchStudents();
  }, []);

  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Teacher" />
        <main className="main-content">
          <h1>Students' Assignment Status</h1>
          <table className="students-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Assignment Status</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.status}</td>
                    <td>{student.submittedAt || "Not Submitted"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No student data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </main>
      </div>
    </>
  );
};

export default ViewStudents;
