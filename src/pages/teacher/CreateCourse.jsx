import React, { useState } from "react";
import { toast } from "react-toastify";
import { createCourse } from "../../services/api";
import NavBar from "../../components/NavBar";
import "../../styles/CreateCourse.css";

const CreateCourse = () => {
  const [formData, setFormData] = useState({
    courseName: "",
    creditPoints: "",
    instructions: "",
    deadline: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.courseName ||
      !formData.creditPoints ||
      !formData.instructions ||
      !formData.deadline
    ) {
      toast.error("Please fill out all fields.");
      return;
    }

    try {
      // הכנת הנתונים לשליחה לשרת
      const courseData = {
        courseName: formData.courseName,
        creditPoints: formData.creditPoints,
        instructions: formData.instructions,
        deadline: formData.deadline,
      };

      // שליחת הבקשה לשרת
      const response = await createCourse(courseData);
      console.log("Course Created Successfully:", response); // דיבאג

      toast.success("Course created successfully!");
      setFormData({
        courseName: "",
        creditPoints: "",
        instructions: "",
        deadline: "",
      });
    } catch (error) {
      console.error("Error creating course:", error.response || error.message);
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
            <label>Instructions</label>
            <textarea
              name="instructions"
              placeholder="Instructions for the course"
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
