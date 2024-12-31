import React, { useState } from "react";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { createAssignment } from "../../services/api";
import { toast } from "react-toastify";
import "../../styles/CreateAssignment.css";

const CreateAssignment = () => {
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false); // מצב טעינה

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !dueDate) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true); // הפעלת מצב טעינה
    try {
      await createAssignment({ name, dueDate });
      toast.success("Assignment created successfully!");
      setName("");
      setDueDate("");
    } catch (error) {
      toast.error("Failed to create assignment.");
    } finally {
      setLoading(false); // כיבוי מצב טעינה
    }
  };

  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Teacher" />
        <main className="main-content">
          <h1>Create Assignment</h1>
          <form className="create-assignment-form" onSubmit={handleSubmit}>
            <label>
              Assignment Name:
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label>
              Due Date:
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </button>
          </form>
        </main>
      </div>
    </>
  );
};

export default CreateAssignment;
