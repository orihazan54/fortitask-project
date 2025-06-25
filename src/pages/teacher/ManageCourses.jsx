import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { 
  getCourses, 
  deleteCourse, 
  updateCourse, 
  uploadAssignment, 
  deleteAssignment,
  getAssignments
} from "../../services/api";
import NavBar from "../../components/NavBar";
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Calendar, 
  Users, 
  CreditCard,
  ArrowLeft,
  Plus,
  User,
  Mail,
  Clock,
  AlertTriangle,
  FileType,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
import { Button } from "../../components/ui/button.jsx";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../../components/ui/card.jsx";
import "../../styles/ManageCourses.css";
import FileMetaAnalyzer from "./FileMetaAnalyzer";
import * as XLSX from "xlsx";

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [assignments, setAssignments] = useState({ materials: [], studentSubmissions: [] });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    creditPoints: "",
    instructions: "",
    deadline: "",
  });
  const [hasShownSuspicionAlert, setHasShownSuspicionAlert] = useState(false);
  const currentCourseIdRef = useRef(null);

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleString(undefined, { 
        year: 'numeric', month: 'numeric', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
      });
    } catch (e) {
      console.error("Error formatting date:", e, "Input date:", date);
      return "Invalid date";
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await getCourses();
        setCourses(data || []);
      } catch (error) {
                  toast.error("Failed to fetch courses.");
        setCourses([]);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse && assignments.studentSubmissions && assignments.studentSubmissions.length > 0) {
      if (!hasShownSuspicionAlert) {
        const firstSuspicious = assignments.studentSubmissions.find(sub => sub.suspectedTimeManipulation === true);
        
        if (firstSuspicious) {
          console.log("useEffect detected suspicious submission, showing alert:", firstSuspicious);
          
          const fileName = firstSuspicious.displayName || firstSuspicious.fileName || "Unknown File";
          const modifiedDate = firstSuspicious.clientReportedDate ? formatDate(firstSuspicious.clientReportedDate) : "N/A";
          const deadlineFormatted = selectedCourse.deadline ? formatDate(selectedCourse.deadline) : "N/A";

          const alertMessage = `❗️ חשד לרמאות! הקובץ "${fileName}" מעורר חשד.
ייתכן שנערך אחרי הדדליין (${deadlineFormatted}).
זמן עריכה מדווח: ${modifiedDate}.`;

          window.alert(alertMessage);
          
          setHasShownSuspicionAlert(true);
        }
      }
    }
  }, [selectedCourse, assignments.studentSubmissions, hasShownSuspicionAlert, formatDate]);

  const handleSelectCourse = async (courseId) => {
    if (currentCourseIdRef.current !== courseId) {
      console.log("Changing course, resetting alert flag.");
      setHasShownSuspicionAlert(false);
      currentCourseIdRef.current = courseId;
    }
    
    if (!courseId) {
      setSelectedCourse(null);
      setAssignments({ materials: [], studentSubmissions: [] });
      return;
    }
    
    setLoading(true);
    try {
      const course = courses.find((c) => c._id === courseId);
      setSelectedCourse(course);
      setIsEditing(false);
      
      const response = await getAssignments(courseId);
      if (response.data.materials && response.data.studentSubmissions) {
        setAssignments({
          materials: response.data.materials,
          studentSubmissions: response.data.studentSubmissions
        });
      } else {
        const materials = (response.data || []).filter(a => a.isMaterial);
        const studentSubmissions = (response.data || []).filter(a => !a.isMaterial);
        setAssignments({ materials, studentSubmissions });
      }

    } catch (error) {
              toast.error("Failed to fetch course details and assignments.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!selectedCourse) return;
    setFormData({
      name: selectedCourse.name || "",
      creditPoints: selectedCourse.creditPoints || "",
      instructions: selectedCourse.instructions || "",
      deadline: selectedCourse.deadline ? new Date(selectedCourse.deadline).toISOString().split("T")[0] : "",
    });
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (!selectedCourse) return;

    if (!window.confirm("Are you sure you want to delete this course?")) {
      return;
    }

    try {
      await deleteCourse(selectedCourse._id);
      setCourses((prev) => prev.filter((course) => course._id !== selectedCourse._id));
      setSelectedCourse(null);
      setIsEditing(false);
              toast.success("Course deleted successfully!");
    } catch (error) {
              toast.error(error.response?.data?.message || "Error deleting course.");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.creditPoints || !formData.instructions || !formData.deadline) {
              toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setUploading(true);
      
      const courseFormData = new FormData();
      courseFormData.append("name", formData.name);
      courseFormData.append("creditPoints", formData.creditPoints);
      courseFormData.append("instructions", formData.instructions);
      courseFormData.append("deadline", formData.deadline);
      
      if (file) {
        courseFormData.append("file", file);
        courseFormData.append("isMaterial", "true");
      }

      const { data } = await updateCourse(selectedCourse._id, courseFormData);
      setCourses((prev) =>
        prev.map((course) =>
          course._id === selectedCourse._id ? data : course
        )
      );
              toast.success("Course updated successfully!");
      
      await handleSelectCourse(selectedCourse._id);
      
      setIsEditing(false);
      setFile(null);
    } catch (error) {
              toast.error(error.response?.data?.message || "Error updating course.");
    } finally {
      setUploading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUploadAssignment = async () => {
    if (!selectedCourse) return;
    if (!file) {
              toast.error("Please select a file to upload.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("isMaterial", "true");
      formData.append("comment", "File uploaded by instructor");

      await uploadAssignment(selectedCourse._id, formData);
              toast.success("Material uploaded successfully!");

      await handleSelectCourse(selectedCourse._id);
      setFile(null);
    } catch (error) {
              toast.error("Error uploading material.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!selectedCourse) return;
    
    if (!window.confirm("Are you sure you want to delete this file?")) {
      return;
    }
    
    try {
      setDeleting(true);
      await deleteAssignment(selectedCourse._id, assignmentId);
              toast.success("File deleted successfully!");
      
      await handleSelectCourse(selectedCourse._id);
    } catch (error) {
              toast.error(error.response?.data?.message || "Error deleting file.");
    } finally {
      setDeleting(false);
    }
  };

  const downloadAssignment = (fileUrl, fileName) => {
    window.open(fileUrl, "_blank");
          toast.success(`Downloading: ${fileName}`);
  };

  const getStudentsCount = () => {
    return selectedCourse && selectedCourse.students ? selectedCourse.students.length : 0;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  };

  const getFileTypeDescription = (mimeType) => {
    if (!mimeType) return "Unknown";
    
    const types = {
      'application/pdf': 'PDF',
      'application/msword': 'Word Document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
      'application/vnd.ms-excel': 'Excel Spreadsheet',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
      'application/vnd.ms-powerpoint': 'PowerPoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
      'image/jpeg': 'JPEG Image',
      'image/png': 'PNG Image',
      'image/gif': 'GIF Image',
      'text/plain': 'Text File',
      'text/html': 'HTML File',
      'application/zip': 'Zip Archive',
      'application/x-rar-compressed': 'RAR Archive'
    };
    
    return types[mimeType] || mimeType;
  };

  const exportMetaReport = (submission) => {
    const data = [
      {
        "Student Name": submission.studentName || "",
        "Student Email": submission.studentEmail || "",
        "File Name": submission.displayName || submission.fileName || "",
        "File Type": getFileTypeDescription(submission.fileType),
        "Submission Time (Local)": submission.uploadedAt ? formatDate(submission.uploadedAt) : "N/A",
        "Last Modified (Server Verified, Local)": submission.lastModifiedUTC
          ? formatDate(submission.lastModifiedUTC)
          : (submission.lastModified ? formatDate(submission.lastModified) : "N/A"),
        "Late By (Submission vs Deadline)": (() => {
          if (!submission.uploadedAt || !selectedCourse?.deadline) return "";
          const diffMs = new Date(submission.uploadedAt) - new Date(selectedCourse.deadline);
          if (diffMs <= 0) return "On time";
          const totalMinutes = Math.floor(diffMs / 60000);
          const days = Math.floor(totalMinutes / 1440);
          const hours = Math.floor((totalMinutes % 1440) / 60);
          const minutes = totalMinutes % 60;
          const parts = [];
          if (days > 0) parts.push(`${days}d`);
          if (hours > 0) parts.push(`${hours}h`);
          if (minutes > 0) parts.push(`${minutes}m`);
          return parts.join(" ");
        })(),
        "Deadline (Local)": selectedCourse?.deadline
          ? formatDate(selectedCourse.deadline)
          : "N/A",
        "Is Late Submission": submission.isLateSubmission ? "Yes" : "No",
        "Is Modified After Deadline (Based on Client Time)": submission.isModifiedAfterDeadline
          ? "Yes"
          : "No",
        "Suspected Time Manipulation": submission.suspectedTimeManipulation ? "Yes" : "No",
        "Comment": submission.submissionComment || "",
      },
    ];
    const columnOrder = [
      "Student Name", "Student Email", "File Name", "File Type", 
      "Submission Time (Local)", "Last Modified (Server Verified, Local)", "Late By (Submission vs Deadline)",
      "Deadline (Local)", "Is Late Submission", 
      "Is Modified After Deadline (Based on Client Time)", "Suspected Time Manipulation", 
      "Comment"
    ];
    const ws = XLSX.utils.json_to_sheet(data, { header: columnOrder });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Meta Report");
    XLSX.writeFile(wb, `${submission.displayName || submission.fileName}-Meta-Report.xlsx`);
  };

  return (
    <div className="bg-gradient">
      <NavBar />
      <div className="manage-courses-container">
        <div className="header-section">
          <h2 className="dashboard-title">Manage Your Courses</h2>
          <Button 
            className="back-to-dashboard-btn" 
            variant="outline"
            onClick={() => (window.location.href = "/teacher-dashboard")}
          >
            <ArrowLeft size={16} />
            Back
          </Button>
        </div>

        <div className="content-section">
          <div className="courses-list">
            <Card>
              <CardHeader>
                <CardTitle>Your Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  className="course-dropdown"
                  onChange={(e) => handleSelectCourse(e.target.value)}
                  value={selectedCourse?._id || ""}
                >
                  <option value="">-- Select a Course --</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
            
            {loading && (
              <div className="loading-spinner">
                <p>Loading data...</p>
              </div>
            )}
            
            {selectedCourse && !isEditing && !loading && (
              <Card className="course-details-card">
                <CardHeader>
                  <CardTitle>{selectedCourse.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="course-info">
                    <div className="info-item">
                      <CreditCard className="info-icon" />
                      <p>
                        <strong>Credit Points:</strong> {selectedCourse.creditPoints}
                      </p>
                    </div>
                    
                    <div className="info-item">
                      <Calendar className="info-icon" />
                      <p>
                        <strong>Deadline:</strong>{" "}
                        {new Date(selectedCourse.deadline).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="info-item">
                      <Users className="info-icon" />
                      <p>
                        <strong>Enrolled Students:</strong> {getStudentsCount()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="card-actions">
                    <Button className="edit-btn" variant="default" onClick={handleEdit}>
                      Edit Course
                    </Button>
                    <Button className="delete-btn" variant="destructive" onClick={handleDelete}>
                      Delete Course
                    </Button>
                  </div>

                  <div className="assignments-section materials-section">
                    <h4 className="section-title">
                      <FileText size={18} />
                      Course Materials
                    </h4>
                    
                    {assignments.materials && assignments.materials.length > 0 ? (
                      <ul className="assignments-list">
                        {assignments.materials.map((assignment) => (
                          <li key={assignment._id} className="assignment-item">
                            <div className="assignment-info">
                              <FileText size={18} />
                              <span className="file-name">{assignment.displayName || assignment.fileName}</span>
                              <span className="file-meta">
                                <FileType size={14} />
                                {getFileTypeDescription(assignment.fileType)}
                                &nbsp;({formatFileSize(assignment.originalSize)})
                              </span>
                              <span className="file-meta">
                                <Clock size={14} />
                                {formatDate(assignment.uploadedAt)}
                              </span>
                            </div>
                            <div className="assignment-actions">
                              <button 
                                className="action-btn download-btn"
                                onClick={() => downloadAssignment(assignment.fileUrl, assignment.displayName || assignment.fileName)}
                                title="Download File"
                              >
                                <Download size={16} />
                              </button>
                              <button 
                                className="action-btn delete-btn"
                                onClick={() => handleDeleteAssignment(assignment._id)}
                                disabled={deleting}
                                title="Delete File"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-assignments">No course materials uploaded yet.</p>
                    )}
                    
                    <div className="upload-new-assignment">
                      <h4 className="section-subtitle">Upload New Material</h4>
                      <div 
                        className={`file-upload-box ${isDragging ? 'dragging' : ''}`}
                        onClick={() => document.getElementById('material-upload').click()}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      >
                        <label>
                          <Upload size={20} />
                          <span className="upload-text">
                            {isDragging ? 'Drop your file here' : 'Drag & drop a file here or click to choose'}
                          </span>
                          <input 
                            id="material-upload"
                            type="file" 
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                          />
                        </label>
                      </div>
                      {file && (
                        <div className="selected-file">
                          <p>Selected file: {file.name}</p>
                          <Button 
                            className="upload-btn"
                            onClick={handleUploadAssignment}
                            disabled={uploading}
                          >
                            {uploading ? "Uploading..." : "Upload Material"}
                            <Plus size={16} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="assignments-section student-submissions-section">
                    <h4 className="section-title">
                      <Users size={18} />
                      Student Submissions
                    </h4>
                    
                    {assignments.studentSubmissions && assignments.studentSubmissions.length > 0 ? (
                      <ul className="student-submissions-list">
                        {assignments.studentSubmissions.map((submission) => {
                          console.log("ManageCourses - Rendering submission:", submission);
                          console.log("ManageCourses - Selected course deadline:", selectedCourse?.deadline);

                          return (
                            <li key={submission._id} className="submission-item">
                              <div className="submission-header">
                                <div className="student-info">
                                  <User size={16} />
                                  <span className="student-name">
                                    {submission.studentName || "Loading student info..."}
                                  </span>
                                  {submission.studentEmail && (
                                    <span className="student-email">
                                      <Mail size={14} />
                                      {submission.studentEmail}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="submission-status">
                                  {submission.isLateSubmission ? (
                                    <span className="late-status">
                                      <AlertTriangle size={16} />
                                      Late Submission
                                    </span>
                                  ) : (
                                    <span className="on-time-status">
                                      <CheckCircle size={16} />
                                      On Time
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="submission-details">
                                <div className="file-info">
                                  <FileText size={16} />
                                  <span className="file-name">{submission.displayName || submission.fileName}</span>
                                  <span className="file-meta">
                                    <FileType size={14} />
                                    {getFileTypeDescription(submission.fileType)}
                                    &nbsp;({formatFileSize(submission.originalSize)})
                                  </span>
                                </div>
                                
                                <div className="submission-dates">
                                  <span className="upload-date">
                                    <Clock size={14} />
                                    Submitted: {formatDate(submission.uploadedAt)}
                                  </span>
                                  
                                  {submission.isModifiedAfterDeadline && (
                                    <span className="warning-text">
                                      <AlertTriangle size={14} />
                                      Modified after deadline: {formatDate(submission.lastModified)}
                                    </span>
                                  )}
                                </div>
                                
                                {submission.submissionComment && (
                                  <div className="submission-comment">
                                    <Info size={14} />
                                    Comment: {submission.submissionComment}
                                  </div>
                                )}
                              </div>
                              
                              <div style={{ margin: "12px 0" }}>
                                <FileMetaAnalyzer
                                  file={{
                                    name: submission.displayName || submission.fileName,
                                  }}
                                  fileMeta={{
                                    lastModifiedUTC: submission.lastModifiedUTC || submission.lastModified,
                                    clientReportedDate: submission.clientReportedDate,
                                    isLateSubmission: submission.isLateSubmission,
                                    isModifiedAfterDeadline: submission.isModifiedAfterDeadline,
                                    isModifiedBeforeButSubmittedLate: submission.isModifiedBeforeButSubmittedLate,
                                    suspectedTimeManipulation: submission.suspectedTimeManipulation,
                                    uploadedAt: submission.uploadedAt
                                  }}
                                  deadline={selectedCourse.deadline}
                                />
                              </div>
                              
                              <div className="submission-actions">
                                <button 
                                  className="action-btn download-btn"
                                  onClick={() =>
                                    downloadAssignment(submission.fileUrl, submission.displayName || submission.fileName)
                                  }
                                  title="Download File"
                                >
                                  <Download size={16} />
                                </button>
                                <button 
                                  className="action-btn delete-btn"
                                  onClick={() => handleDeleteAssignment(submission._id)}
                                  disabled={deleting}
                                  title="Delete Submission"
                                >
                                  <Trash2 size={16} />
                                </button>
                                <button
                                  className="action-btn"
                                  style={{ color: "#4ade80" }}
                                  onClick={() => exportMetaReport(submission)}
                                  title="Download Metadata Report"
                                >
                                  <Download size={16} /> <span style={{fontSize:12, marginLeft:3}}>Meta Report</span>
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="no-assignments">No student submissions yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {isEditing && (
            <Card className="edit-course-form">
              <CardHeader>
                <CardTitle>Edit Course</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="form-group">
                  <label>Course Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Credit Points</label>
                  <input
                    type="number"
                    name="creditPoints"
                    value={formData.creditPoints}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Instructions</label>
                  <textarea
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleFormChange}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Deadline</label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleFormChange}
                  />
                </div>
                
                <div className="form-group file-upload-section">
                  <label>Upload Material (Optional)</label>
                  <div className="file-upload-box" onClick={() => document.getElementById('edit-file-upload').click()}>
                    <label>
                      <Upload size={20} />
                      <span>Choose File</span>
                      <input 
                        id="edit-file-upload"
                        type="file" 
                        onChange={handleFileChange} 
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                  {file && <p className="selected-file-name">Selected file: {file.name}</p>}
                </div>
              </CardContent>
              <CardFooter>
                <div className="form-actions">
                  <Button 
                    className="save-btn" 
                    onClick={handleSave} 
                    disabled={uploading}
                  >
                    {uploading ? "Saving Changes..." : "Save Changes"}
                  </Button>
                  <Button
                    className="cancel-btn"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFile(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageCourses;
