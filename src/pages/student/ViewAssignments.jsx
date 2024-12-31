import React, { useState, useEffect } from "react";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import "../../styles/ViewAssignments.css";
import { getUserAssignments } from "../../services/api";

const ViewAssignments = () => {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const { data } = await getUserAssignments();
        setAssignments(data);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };
    fetchAssignments();
  }, []);

  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Student" />
        <main className="main-content">
          <h1>My Assignments</h1>
          <table className="assignments-table">
            <thead>
              <tr>
                <th>Assignment Name</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>{assignment.name}</td>
                    <td>{assignment.dueDate}</td>
                    <td>{assignment.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No assignments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </main>
      </div>
    </>
  );
};

export default ViewAssignments;
