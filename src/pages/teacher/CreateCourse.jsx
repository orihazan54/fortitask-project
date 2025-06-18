
import React, { useState } from "react";
import { toast } from "react-toastify";
import { createCourse } from "../../services/api";
import NavBar from "../../components/NavBar";
import { Upload, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import "../../styles/CreateCourse.css";

const CreateCourse = () => {
  const [formData, setFormData] = useState({
    courseName: "",
    creditPoints: "",
    instructions: "",
    deadline: "",
    deadlineTime: "23:59", // שעת ברירת מחדל לדדליין
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      console.log("File selected:", {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      // שילוב התאריך והשעה לתאריך מלא
      const deadlineWithTime = `${formData.deadline}T${formData.deadlineTime}`;
      
      const courseFormData = new FormData();
      courseFormData.append("courseName", formData.courseName);
      courseFormData.append("creditPoints", formData.creditPoints);
      courseFormData.append("instructions", formData.instructions);
      courseFormData.append("deadline", deadlineWithTime);

      if (file) {
        console.log("Adding file to FormData:", file.name);
        courseFormData.append("file", file);
      }

      console.log("Submitting course form data");
      const response = await createCourse(courseFormData);
      console.log("Course Created Successfully:", response);

      toast.success("Course created successfully!");
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
      toast.error(error.response?.data?.message || "Failed to create course.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gradient">
      <NavBar />
      <div className="dashboard-container">
        <div className="create-course-container">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/teacher-dashboard")}
            className="back-btn mb-6"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>

          <Card className="create-course-card animate-fade-in">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Create New Course</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="create-course-form space-y-4">
                <div className="form-group">
                  <label className="text-white/90 font-medium mb-1 block">Course Name</label>
                  <input
                    type="text"
                    name="courseName"
                    placeholder="Course Name"
                    value={formData.courseName}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="text-white/90 font-medium mb-1 block">Credit Points</label>
                  <input
                    type="number"
                    name="creditPoints"
                    placeholder="Credit Points"
                    value={formData.creditPoints}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="text-white/90 font-medium mb-1 block">Instructions</label>
                  <textarea
                    name="instructions"
                    placeholder="Instructions for the course"
                    value={formData.instructions}
                    onChange={handleChange}
                    required
                    className="form-textarea"
                  ></textarea>
                </div>

                <div className="deadline-inputs-container">
                  <div className="form-group">
                    <label className="text-white/90 font-medium mb-1 block">Deadline Date</label>
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
                    <label className="text-white/90 font-medium mb-1 block">Deadline Time</label>
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
                  <label>
                    <div className="file-upload-box">
                      <Upload size={24} className="file-icon" />
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
                  <Button
                    type="submit"
                    className="submit-btn"
                    disabled={uploading}
                  >
                    {uploading ? "Creating..." : "Create Course"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateCourse;