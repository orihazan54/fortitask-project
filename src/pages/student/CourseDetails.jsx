
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getCourseDetails, uploadAssignment, getUserDetails, downloadAssignment } from "../../services/api";
import NavBar from "../../components/NavBar";
import { Upload, Download, FileText, Clock } from "lucide-react";
import "../../styles/CourseDetails.css";

const CourseDetails = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [teacherName, setTeacherName] = useState("Unknown Teacher");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
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

    fetchCourseDetails();
  }, [courseId]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
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
      setUploading(true);
      const response = await uploadAssignment(courseId, formData);
      toast.success("Assignment uploaded successfully!");
      // רענון הנתונים לאחר העלאה
      const { data } = await getCourseDetails(courseId);
      setCourse(data);
      setFile(null);
    } catch (error) {
      toast.error("Failed to upload assignment.");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (sizeInBytes) => {
    if (!sizeInBytes) return "Unknown size";
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <FileText size={20} />;
    if (fileType.includes("pdf")) return <FileText size={20} />;
    if (fileType.includes("image")) return <FileText size={20} />;
    if (fileType.includes("word") || fileType.includes("doc")) return <FileText size={20} />;
    return <FileText size={20} />;
  };

  if (!course) {
    return <div className="loading">Loading...</div>;
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
            <ul className="assignments-list">
              {course.assignments.map((assignment, index) => (
                <li key={index} className="assignment-item">
                  <div className="assignment-details">
                    <div className="assignment-icon">
                      {getFileIcon(assignment.fileType)}
                    </div>
                    <div className="assignment-info">
                      <span className="assignment-name">{assignment.fileName}</span>
                      <div className="assignment-meta">
                        {assignment.uploadedAt && (
                          <span className="upload-date">
                            <Clock size={14} />
                            Uploaded: {new Date(assignment.uploadedAt).toLocaleDateString()}
                          </span>
                        )}
                        {assignment.originalSize && (
                          <span className="file-size">
                            Size: {formatFileSize(assignment.originalSize)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      className="btn download-btn" 
                      onClick={() => downloadAssignment(assignment.fileUrl)}
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
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
          <div className="file-upload-box">
            <label>
              <Upload size={20} />
              <span>Select File</span>
              <input 
                type="file" 
                onChange={handleFileChange} 
                style={{ display: "none" }}
              />
            </label>
          </div>
          {file && (
            <div className="selected-file">
              <p>Selected file: {file.name}</p>
              <button 
                className="btn upload-btn" 
                onClick={handleFileUpload}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          )}
        </div>

        {/* הצגת מטלות שהסטודנט הגיש */}
        <div className="submitted-assignments">
          <h3>Your Submitted Assignments</h3>
          {assignments.length > 0 ? (
            <ul className="assignments-list">
              {assignments.map((assignment) => (
                <li key={assignment._id} className="assignment-item">
                  <div className="assignment-details">
                    <div className="assignment-icon">
                      {getFileIcon(assignment.fileType)}
                    </div>
                    <div className="assignment-info">
                      <span className="assignment-name">{assignment.filename}</span>
                      <div className="assignment-meta">
                        <span className="grade-status">
                          Grade: {assignment.grade || "Not graded"}
                        </span>
                      </div>
                    </div>
                  </div>
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