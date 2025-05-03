
import React, { useState } from "react";
import { toast } from "react-toastify";
import { createCourse } from "../../services/api";
import NavBar from "../../components/NavBar";
import { Upload } from "lucide-react"; // ייבוא אייקון
import "../../styles/CreateCourse.css";

const CreateCourse = () => {
  const [formData, setFormData] = useState({
    courseName: "",
    creditPoints: "",
    instructions: "",
    deadline: "",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
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
      setUploading(true);

      // הכנת הטופס לשליחה עם הקובץ
      const courseFormData = new FormData();
      courseFormData.append("courseName", formData.courseName);
      courseFormData.append("creditPoints", formData.creditPoints);
      courseFormData.append("instructions", formData.instructions);
      courseFormData.append("deadline", formData.deadline);

      // הוספת הקובץ אם יש
      if (file) {
        courseFormData.append("file", file);
      }

      // שליחת הבקשה לשרת
      const response = await createCourse(courseFormData);
      console.log("Course Created Successfully:", response); // דיבאג

      toast.success("Course created successfully!");
      setFormData({
        courseName: "",
        creditPoints: "",
        instructions: "",
        deadline: "",
      });
      setFile(null);
    } catch (error) {
      console.error("Error creating course:", error.response || error.message);
      toast.error(error.response?.data?.message || "Failed to create course.");
    } finally {
      setUploading(false);
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

          {/* הוספת אזור העלאת קובץ */}
          <div className="form-group file-upload-section">
            <label>
              <div className="file-upload-box">
                <Upload size={24} />
                <span>Upload Assignment File (Optional)</span>
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  style={{ display: "none" }}
                />
              </div>
            </label>
            {file && (
              <div className="selected-file">
                <p>Selected file: {file.name}</p>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn primary-btn"
              disabled={uploading}
            >
              {uploading ? "Creating..." : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateCourse;