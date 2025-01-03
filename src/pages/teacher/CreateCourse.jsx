import React, { useState } from "react";
import { toast } from "react-toastify";
import { createCourse } from "../../services/api";
import NavBar from "../../components/NavBar";
import "../../styles/CreateCourse.css";

const CreateCourse = () => {
  const [formData, setFormData] = useState({
    courseName: "",
    creditPoints: "",
    file: null,
    instructions: "",
    deadline: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.courseName ||
      !formData.creditPoints ||
      !formData.file ||
      !formData.instructions ||
      !formData.deadline
    ) {
      toast.error("Please fill out all fields.");
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("courseName", formData.courseName);
      formDataToSend.append("creditPoints", formData.creditPoints);
      formDataToSend.append("file", formData.file);
      formDataToSend.append("instructions", formData.instructions);
      formDataToSend.append("deadline", formData.deadline);

      await createCourse(formDataToSend);
      toast.success("Course created successfully!");
      setFormData({
        courseName: "",
        creditPoints: "",
        file: null,
        instructions: "",
        deadline: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create course.");
    }
  };

  return (
    <>
      <NavBar />
      <div className="create-course-container">
        <div className="header-buttons">
          <button
            className="back-btn"
            onClick={() => (window.location.href = "/teacher-dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-course-form">
          <h2>Create New Course</h2>
          <div className="form-group">
            <label>Course Name</label>
            <input
              type="text"
              name="courseName"
              placeholder="Course Name"
              value={formData.courseName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Credit Points</label>
            <input
              type="number"
              name="creditPoints"
              placeholder="Credit Points"
              value={formData.creditPoints}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Upload Assignment File</label>
            <input
              type="file"
              name="file"
              onChange={handleFileChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Instructions</label>
            <textarea
              name="instructions"
              placeholder="Instructions for the assignment"
              value={formData.instructions}
              onChange={handleChange}
              required
            ></textarea>
          </div>
          <div className="form-group">
            <label>Deadline</label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn primary-btn">
              Create Course
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateCourse;
