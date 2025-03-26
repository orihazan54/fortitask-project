
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  getCourseDetails, 
  uploadAssignment, 
  getUserDetails, 
  downloadAssignment,
  deleteAssignment,
  getAssignments
} from "../../services/api";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import { 
  Upload, 
  Download, 
  FileText, 
  Clock, 
  AlertTriangle, 
  Check, 
  X, 
  Calendar, 
  User,
  Book,
  ArrowLeft,
  Trash2,
  Info
} from "lucide-react";
import "../../styles/CourseDetails.css";

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [teacherName, setTeacherName] = useState("Unknown Teacher");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [studentAssignments, setStudentAssignments] = useState([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const { data } = await getCourseDetails(courseId);
        setCourse(data);
        if (data.teacherId) {
          setTeacherName(data.teacherName || "Unknown Teacher");
        }
        
        // Fetch course assignments
        const assignmentsResponse = await getAssignments(courseId);
        setAssignments(data.assignments || []);
        
        // Filter student's assignments
        const myAssignments = assignmentsResponse.data.filter(assignment => 
          assignment.studentId === localStorage.getItem("userId")
        );
        setStudentAssignments(myAssignments);
      } catch (error) {
        toast.error("Error loading course details.");
        console.error("Error fetching course details:", error);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("courseId", courseId);

    try {
      setUploading(true);
      const response = await uploadAssignment(courseId, formData);
      
      // Check server response metadata
      if (response.data.isLate) {
        toast.warning("Note! Assignment was submitted after the deadline.", {
          autoClose: 7000,
        });
      }
      
      if (response.data.isModifiedAfterDeadline) {
        toast.error("Note! The uploaded file was modified after the deadline.", {
          autoClose: 7000,
        });
      } else {
        toast.success("Assignment uploaded successfully!");
      }
      
      // Update data after upload
      const { data } = await getCourseDetails(courseId);
      setCourse(data);
      setAssignments(data.assignments || []);
      
      // Filter student assignments
      const updatedStudentAssignments = data.assignments.filter(assignment => 
        assignment.studentId === localStorage.getItem("userId")
      );
      setStudentAssignments(updatedStudentAssignments);
      
      setFile(null);
    } catch (error) {
      toast.error("Error uploading assignment");
      console.error("Error uploading assignment:", error);
    } finally {
      setUploading(false);
    }
  };

  const confirmDeleteAssignment = (assignment) => {
    if (assignment.isLateSubmission) {
      toast.error("Late submissions cannot be deleted", {
        icon: <AlertTriangle size={24} />,
      });
      return;
    }
    
    setAssignmentToDelete(assignment);
    setShowConfirmDelete(true);
  };
  
  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    
    try {
      await deleteAssignment(courseId, assignmentToDelete._id);
      toast.success("Assignment deleted successfully");
      
      // Update data after deletion
      const { data } = await getCourseDetails(courseId);
      setCourse(data);
      setAssignments(data.assignments || []);
      
      // Filter student assignments
      const updatedStudentAssignments = data.assignments.filter(assignment => 
        assignment.studentId === localStorage.getItem("userId")
      );
      setStudentAssignments(updatedStudentAssignments);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("Cannot delete a late submission");
      } else {
        toast.error("Error deleting assignment");
      }
      console.error("Error deleting assignment:", error);
    } finally {
      setShowConfirmDelete(false);
      setAssignmentToDelete(null);
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

  const getStatusIcon = (assignment) => {
    if (assignment.isLateSubmission) {
      return <AlertTriangle size={18} className="status-icon late" title="Submitted late" />;
    }
    if (assignment.isModifiedAfterDeadline) {
      return <AlertTriangle size={18} className="status-icon modified" title="Modified after deadline" />;
    }
    return <Check size={18} className="status-icon on-time" title="Submitted on time" />;
  };

  if (!course) {
    return (
      <>
        <NavBar />
        <div className="courses-container">
          <Sidebar role="Student" />
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading course details...</p>
          </div>
        </div>
      </>
    );
  }

  // Calculate time until deadline
  const deadlineDate = new Date(course.deadline);
  const now = new Date();
  const timeRemaining = deadlineDate - now;
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const isDeadlinePassed = timeRemaining < 0;

  return (
    <>
      <NavBar />
      <div className="courses-container">
        <Sidebar role="Student" />
        <div className="course-details-container">
          <div className="course-header">
            <button className="back-btn" onClick={() => navigate("/student/my-courses")}>
              <ArrowLeft size={16} />
              Back to My Courses
            </button>
            <h2 className="course-title">{course.name}</h2>
          </div>
          
          <div className="course-info-grid">
            <div className="course-info-card">
              <h3 className="card-title">Course Information</h3>
              <div className="info-item">
                <span className="info-label">Credits:</span>
                <span className="info-value">{course.creditPoints}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Instructor:</span>
                <span className="info-value">{teacherName}</span>
              </div>
              <div className="info-item deadline-info">
                <span className="info-label">Deadline:</span>
                <span className={`info-value ${isDeadlinePassed ? 'deadline-passed' : ''}`}>
                  <Calendar size={16} className="icon" />
                  {new Date(course.deadline).toLocaleDateString()}
                  {!isDeadlinePassed ? (
                    <span className="time-remaining">
                      ({daysRemaining} days and {hoursRemaining} hours left)
                    </span>
                  ) : (
                    <span className="deadline-passed-text">Deadline has passed</span>
                  )}
                </span>
              </div>
            </div>
            
            <div className="course-info-card instructions-card">
              <h3 className="card-title">Instructions</h3>
              <p className="instructions-text">{course.instructions || "No instructions provided for this course."}</p>
            </div>
          </div>

          {/* Course materials section */}
          <div className="assignments-section">
            <h3 className="section-title">Course Materials</h3>
            {course.assignments && course.assignments.filter(a => !a.studentId).length > 0 ? (
              <ul className="assignments-list">
                {course.assignments.filter(a => !a.studentId).map((assignment, index) => (
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
              <div className="no-data-message">
                <Info size={48} className="no-data-icon" />
                <p>No course materials available.</p>
              </div>
            )}
          </div>

          {/* Assignment upload section */}
          <div className="upload-section">
            <h3 className="section-title">Submit Your Assignment</h3>
            <div className={`file-upload-box ${isDeadlinePassed ? 'deadline-passed' : ''}`}>
              {isDeadlinePassed ? (
                <div className="deadline-warning">
                  <AlertTriangle size={24} />
                  <p>Deadline has passed. You may still submit, but your assignment will be marked as late and cannot be deleted.</p>
                </div>
              ) : (
                <label>
                  <div className="upload-inner">
                    <Upload size={24} />
                    <span>Choose a file to upload</span>
                    <input 
                      type="file" 
                      onChange={handleFileChange} 
                      style={{ display: "none" }}
                    />
                  </div>
                </label>
              )}
            </div>
            {file && (
              <div className="selected-file">
                <p>Selected file: {file.name} ({formatFileSize(file.size)})</p>
                <div className="file-upload-actions">
                  <button 
                    className="btn upload-btn" 
                    onClick={handleFileUpload}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                  <button 
                    className="btn cancel-btn" 
                    onClick={() => setFile(null)}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Student's submitted assignments section */}
          <div className="student-assignments-section">
            <h3 className="section-title">Your Submissions</h3>
            {studentAssignments.length > 0 ? (
              <ul className="student-assignments-list">
                {studentAssignments.map((assignment, index) => (
                  <li key={index} className="student-assignment-item">
                    <div className="assignment-details">
                      <div className="assignment-icon">
                        {getFileIcon(assignment.fileType)}
                      </div>
                      <div className="assignment-info">
                        <div className="assignment-header">
                          <span className="assignment-name">{assignment.fileName}</span>
                          {getStatusIcon(assignment)}
                        </div>
                        <div className="assignment-meta">
                          <span className="upload-date">
                            <Clock size={14} />
                            Submitted: {new Date(assignment.uploadedAt).toLocaleDateString()}
                          </span>
                          {assignment.lastModified && (
                            <span className="modified-date">
                              Last modified: {new Date(assignment.lastModified).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="assignment-actions">
                        <button 
                          className="btn download-btn" 
                          onClick={() => downloadAssignment(assignment.fileUrl)}
                          title="Download"
                        >
                          <Download size={18} />
                        </button>
                        {!assignment.isLateSubmission && (
                          <button 
                            className="btn delete-btn" 
                            onClick={() => confirmDeleteAssignment(assignment)}
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-data-message">
                <Info size={48} className="no-data-icon" />
                <p>You haven't submitted any assignments for this course yet.</p>
              </div>
            )}
          </div>

          {/* Confirmation dialog for deleting assignments */}
          {showConfirmDelete && (
            <div className="modal-overlay">
              <div className="confirmation-modal">
                <h4>Confirm Deletion</h4>
                <p>Are you sure you want to delete this assignment?</p>
                <p className="filename">{assignmentToDelete?.fileName}</p>
                <div className="modal-actions">
                  <button className="btn confirm-btn" onClick={handleDeleteAssignment}>
                    Yes, Delete
                  </button>
                  <button className="btn cancel-btn" onClick={() => setShowConfirmDelete(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CourseDetails;