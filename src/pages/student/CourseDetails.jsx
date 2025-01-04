import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getCourseDetails, uploadAssignment, getUserDetails } from "../../services/api";
import NavBar from "../../components/NavBar";
import "../../styles/CourseDetails.css";

const CourseDetails = () => {
  const { courseId } = useParams(); // מזהה הקורס מהנתיב
  const [course, setCourse] = useState(null);
  const [teacherName, setTeacherName] = useState("Unknown Teacher");
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const { data } = await getCourseDetails(courseId);
        setCourse(data);

        // Fetching teacher details if teacherId exists
        if (data.teacherId) {
          const teacherResponse = await getUserDetails(data.teacherId);
          setTeacherName(teacherResponse.data.username || "Unknown Teacher");
        }
      } catch (error) {
        toast.error("Failed to load course details.");
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("courseId", courseId);

    try {
      await uploadAssignment(formData);
      toast.success("File uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload file.");
    }
  };

  if (!course) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <NavBar />
      <div className="course-details-container">
        <h2 className="course-title">{course.name}</h2>
        <div className="course-info">
          <p><strong>Credits:</strong> {course.creditPoints}</p>
          <p><strong>Deadline:</strong> {new Date(course.deadline).toLocaleDateString()}</p>
          <p><strong>Instructions:</strong> {course.instructions || "No instructions provided."}</p>
          <p><strong>Teacher:</strong> {teacherName}</p>
          <p><strong>Students Enrolled:</strong> {course.students?.length || 0}</p>
        </div>

        <div className="upload-section">
          <h3>Upload Your Assignment</h3>
          <input type="file" onChange={handleFileChange} />
          <button className="btn upload-btn" onClick={handleFileUpload}>
            Upload
          </button>
        </div>
      </div>
    </>
  );
};

export default CourseDetails;
