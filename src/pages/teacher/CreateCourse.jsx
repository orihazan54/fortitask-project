import React, { useState } from "react";
import { toast } from "sonner";
import { createCourse } from "../../services/api";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { Upload, ArrowLeft } from "lucide-react";
import "../../styles/CreateCourse.css";

// Comprehensive course creation interface with file upload and advanced form validation
const CreateCourse = () => {
  // Complete form state management for course creation workflow
  const [formData, setFormData] = useState({
    courseName: "",
    creditPoints: "",
    instructions: "",
    deadline: "",
    deadlineTime: "23:59", // Default deadline time for consistency
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Dynamic form input handler with real-time state updates
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Secure file selection with comprehensive metadata logging
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Detailed file information logging for debugging and verification
      console.log("File selected:", {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });
      setFile(selectedFile);
    }
  };

  // Advanced drag-and-drop file upload interface with visual feedback
  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Smart drag leave detection to prevent flickering
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Professional drag-and-drop file handling with metadata capture
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      // Comprehensive file drop logging for user experience tracking
      console.log("File dropped:", {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });
      setFile(selectedFile);
    }
  };

  // Comprehensive form submission with validation and file upload
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation before server submission
    if (
      !formData.courseName ||
      !formData.creditPoints ||
      !formData.instructions ||
      !formData.deadline ||
      !formData.deadlineTime
    ) {
              toast.error("Please fill out all fields.");
      return;
    }

    try {
      setUploading(true);

      // Smart datetime combination for precise deadline setting
      // שילוב התאריך והשעה לתאריך מלא
      const deadlineWithTime = `${formData.deadline}T${formData.deadlineTime}`;
      
      // Structured FormData preparation for multipart upload
      const courseFormData = new FormData();
      courseFormData.append("courseName", formData.courseName);
      courseFormData.append("creditPoints", formData.creditPoints);
      courseFormData.append("instructions", formData.instructions);
      courseFormData.append("deadline", deadlineWithTime);

      // Optional file attachment for course materials
      if (file) {
        console.log("Adding file to FormData:", file.name);
        courseFormData.append("file", file);
      }

      console.log("Submitting course form data");
      const response = await createCourse(courseFormData);
      console.log("Course Created Successfully:", response);

              toast.success("Course created successfully!");
      
      // Form reset for clean user experience after successful creation
      setFormData({
        courseName: "",
        creditPoints: "",
        instructions: "",
        deadline: "",
        deadlineTime: "23:59",
      });
      setFile(null);
    } catch (error) {
      console.error("Error creating course:", error.response || error.message);
      // User-friendly error messaging with fallback
              toast.error(error.response?.data?.message || "Failed to create course.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <NavBar />
      <div className="courses-container">
        <Sidebar role="Teacher" />
        <div className="create-course-container">
          {/* Professional header with navigation and clear page purpose */}
          <div className="course-header">
            <button
              className="back-btn"
              onClick={() => (window.location.href = "/teacher-dashboard")}
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
            <h1 className="course-title">Create New Course</h1>
          </div>

          {/* Comprehensive course creation form with structured input fields */}
          <div className="create-course-card">
            <form onSubmit={handleSubmit} className="create-course-form">
              {/* Course identification and credit information row */}
              <div className="form-row">
                <div className="form-group">
                  <label>Course Name</label>
                  <input
                    type="text"
                    name="courseName"
                    placeholder="Enter course name"
                    value={formData.courseName}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Credit Points</label>
                  <input
                    type="number"
                    name="creditPoints"
                    placeholder="Enter credit points"
                    value={formData.creditPoints}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              {/* Detailed course instructions and requirements section */}
              <div className="form-group">
                <label>Instructions</label>
                <textarea
                  name="instructions"
                  placeholder="Enter course instructions and requirements"
                  value={formData.instructions}
                  onChange={handleChange}
                  required
                  className="form-textarea"
                  rows={4}
                ></textarea>
              </div>

              {/* Precise deadline configuration with date and time selection */}
              <div className="form-row">
                <div className="form-group">
                  <label>Deadline Date</label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Deadline Time</label>
                  <input
                    type="time"
                    name="deadlineTime"
                    value={formData.deadlineTime}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group file-upload-section">
                <label>Assignment File (Optional)</label>
                <div 
                  className={`file-upload-box ${isDragging ? 'dragging' : ''}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <label className="upload-label">
                    <div className="upload-inner">
                      <Upload size={24} />
                      <span className="upload-text">
                        {isDragging 
                          ? 'Drop your file here' 
                          : 'Drag & drop a file here or click to choose'
                        }
                      </span>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                    </div>
                  </label>
                </div>
                {file && (
                  <div className="selected-file">
                    <p>Selected file: <strong>{file.name}</strong></p>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={uploading}
                >
                  {uploading ? "Creating Course..." : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateCourse;