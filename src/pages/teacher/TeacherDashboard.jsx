import React, { useState, useEffect } from "react";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { uploadAssignment, getCourses, getCourseDetails } from "../../services/api";
import { toast } from "react-toastify";
import "../../styles/TeacherDashboard.css";

const TeacherDashboard = () => {
  const [file, setFile] = useState(null);
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);

  /** 📌 שליפת רשימת הקורסים מהשרת */
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await getCourses();
        setCourses(data);
      } catch (error) {
        toast.error("❌ Failed to load courses.");
        console.error("Error fetching courses:", error);
      }
    };
    fetchCourses();
  }, []);

  /** 📌 שליפת רשימת המטלות של הקורס שנבחר */
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!courseId) return;
      try {
        const { data } = await getCourseDetails(courseId);
        setAssignments(data.assignments || []);
      } catch (error) {
        toast.error("❌ Failed to load assignments.");
        console.error("Error fetching assignments:", error);
      }
    };
    fetchAssignments();
  }, [courseId]);

  /** 📌 בחירת קובץ */
  const handleFileChange = (e) => setFile(e.target.files[0]);

  /** 📌 בחירת קורס */
  const handleCourseChange = (e) => setCourseId(e.target.value);

  /** 📤 העלאת מטלה */
  const handleFileUpload = async () => {
    if (!file || !courseId) {
      toast.error("⚠️ Please select a course and a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    console.log("📤 Uploading file...");
    console.log("📌 Course ID:", courseId);
    console.log("📂 File:", file);

    try {
      const response = await uploadAssignment(courseId, formData);
      console.log("✅ Upload success:", response.data);

      toast.success("✅ Assignment uploaded successfully!");
      setFile(null);
      document.getElementById("file-input").value = "";

      // טעינת רשימת המטלות מחדש לאחר העלאה מוצלחת
      const { data } = await getCourseDetails(courseId);
      setAssignments(data.assignments || []);

    } catch (error) {
      console.error("❌ Upload failed:", error.response?.data || error.message);
      toast.error(`❌ Failed to upload assignment: ${error.response?.data?.message || "Unknown error"}`);
    }
  };

  return (
    <>
      <NavBar />
      <div className="dashboard-container">
        <Sidebar role="Teacher" />
        <main className="main-content">
          <h2 className="dashboard-title">📚 Teacher Dashboard</h2>

          <div className="upload-container">
            <h3>📤 Upload Assignment</h3>

            <label>Select Course:</label>
            <select value={courseId} onChange={handleCourseChange} className="course-select">
              <option value="">-- Choose a Course --</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>

            <label>Select File:</label>
            <input id="file-input" type="file" onChange={handleFileChange} className="file-input" />

            <button className="upload-btn" onClick={handleFileUpload}>Upload</button>
          </div>

          {/* 📄 הצגת רשימת המטלות שהמורה העלה */}
          {courseId && assignments.length > 0 && (
            <div className="assignments-list">
              <h3>📄 Uploaded Assignments</h3>
              <ul>
                {assignments.map((assignment, index) => (
                  <li key={index}>
                    {assignment.fileName}{" "}
                    <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer">
                      📥 Download
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default TeacherDashboard;
