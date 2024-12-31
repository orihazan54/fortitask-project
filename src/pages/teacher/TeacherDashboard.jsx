import React, { useState, useEffect } from "react";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { getAllAssignments } from "../../services/api";
import { toast } from "react-toastify";
import "../../styles/Dashboard.css";

const TeacherDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false); // מצב טעינה

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true); // הפעלת מצב טעינה
      try {
        const { data } = await getAllAssignments();
        setAssignments(data);
      } catch (error) {
        toast.error("Failed to fetch assignments.");
      } finally {
        setLoading(false); // כיבוי מצב טעינה
      }
    };

    fetchAssignments();
  }, []);

  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Teacher" />
        <main className="main-content">
          <h1>Welcome to the Teacher Dashboard!</h1>
          <section className="assignments-section">
            <h2>Your Assignments</h2>
            {loading ? (
              <p>Loading assignments...</p>
            ) : assignments.length > 0 ? (
              <table className="assignments-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Due Date</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>{assignment.id}</td>
                      <td>{assignment.name}</td>
                      <td>{assignment.dueDate}</td>
                      <td>{new Date(assignment.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No assignments found.</p>
            )}
          </section>
        </main>
      </div>
    </>
  );
};

export default TeacherDashboard;
