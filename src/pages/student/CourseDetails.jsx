import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getCourseDetails, uploadAssignment, getUserDetails, getAssignments, downloadAssignment } from "../../services/api";
import NavBar from "../../components/NavBar";
import "../../styles/CourseDetails.css";

const CourseDetails = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [teacherName, setTeacherName] = useState("Unknown Teacher");
  const [file, setFile] = useState(null);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const { data } = await getCourseDetails(courseId);
        setCourse(data);
        if (data.teacherId) {
          const teacherResponse = await getUserDetails(data.teacherId);
          setTeacherName(teacherResponse.data.username || "Unknown Teacher");
        }
      } catch (error) {
        toast.error("Failed to load course details.");
      }
    };

    const fetchAssignments = async () => {
      try {
        const { data } = await getAssignments(courseId);
        setAssignments(data);
      } catch (error) {
        toast.error("Failed to load assignments.");
      }
    };

    fetchCourseDetails();
    fetchAssignments();
  }, [courseId]);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleFileUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("courseId", courseId);

    try {
      await uploadAssignment(courseId, formData);
      toast.success("Assignment uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload assignment.");
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
        </div>

        {/* הצגת מטלות שהמורה העלה */}
        <div className="assignments-section">
          <h3>Course Assignments</h3>
          {course.assignments && course.assignments.length > 0 ? (
            <ul>
              {course.assignments.map((assignment, index) => (
                <li key={index}>
                  {assignment.fileName}{" "}
                  <button className="btn download-btn" onClick={() => downloadAssignment(assignment.fileUrl)}>
                    📥 Download
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No assignments uploaded yet.</p>
          )}
        </div>

        {/* העלאת מטלה ע"י הסטודנט */}
        <div className="upload-section">
          <h3>Upload Your Assignment</h3>
          <input type="file" onChange={handleFileChange} />
          <button className="btn upload-btn" onClick={handleFileUpload}>
            Upload
          </button>
        </div>

        {/* הצגת מטלות שהסטודנט הגיש */}
        <div className="submitted-assignments">
          <h3>Submitted Assignments</h3>
          {assignments.length > 0 ? (
            <ul>
              {assignments.map((assignment) => (
                <li key={assignment._id}>
                  {assignment.filename} - <strong>Grade:</strong> {assignment.grade || "Not graded"}
                </li>
              ))}
            </ul>
          ) : (
            <p>No assignments submitted yet.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default CourseDetails;
