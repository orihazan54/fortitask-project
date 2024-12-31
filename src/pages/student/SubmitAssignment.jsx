import React, { useState } from "react";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import "../../styles/SubmitAssignment.css";
import { uploadAssignment } from "../../services/api";

const SubmitAssignment = () => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("assignment", file);

    try {
      await uploadAssignment(formData);
      alert("Assignment submitted successfully!");
      setFile(null);
    } catch (error) {
      alert("Failed to submit assignment.");
    }
  };

  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Student" />
        <main className="main-content">
          <h1>Submit Assignment</h1>
          <input type="file" onChange={handleFileChange} />
          <button onClick={handleSubmit}>Submit</button>
        </main>
      </div>
    </>
  );
};

export default SubmitAssignment;
