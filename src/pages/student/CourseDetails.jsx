import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  getCourseDetails, 
  uploadAssignment, 
  downloadAssignment,
  deleteAssignment
} from "../../services/api";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import CourseHeader from "../../components/course/CourseHeader";
import CourseInformation from "../../components/course/CourseInformation";
import CourseMaterials from "../../components/course/CourseMaterials";
import AssignmentUpload from "../../components/course/AssignmentUpload";
import StudentSubmissions from "../../components/course/StudentSubmissions";
import DeleteConfirmationModal from "../../components/course/DeleteConfirmationModal";
import { ArrowLeft, Clock } from "lucide-react";
import "../../styles/CourseDetails.css";

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [teacherName, setTeacherName] = useState("Unknown Teacher");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [studentAssignments, setStudentAssignments] = useState([]);
  const [courseMaterials, setCourseMaterials] = useState([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadComment, setUploadComment] = useState("");
  const [uploadError, setUploadError] = useState(null);
  
  // (הוסר מנגנון התראה לסטודנט על חשד לרמאות)

  useEffect(() => {
    const fetchCourseDetails = async () => {
      setLoading(true);
      try {
        console.log("Fetching course details for ID:", courseId);
        const { data } = await getCourseDetails(courseId);
        console.log("Course data received:", data);
        setCourse(data);
        
        if (data.teacherId) {
          setTeacherName(data.teacherName || "Unknown Teacher");
        }
        
        const currentUserId = localStorage.getItem("userId");
        console.log("Current user ID:", currentUserId);
        
        const myAssignments = data.assignments ? data.assignments.filter(assignment => {
          if (!assignment.studentId) return false;
          
          const assignmentStudentId = typeof assignment.studentId === 'object' ? 
            assignment.studentId._id || assignment.studentId : assignment.studentId;
            
          console.log("Comparing:", { 
            assignmentId: assignmentStudentId, 
            currentId: currentUserId, 
            isEqual: assignmentStudentId === currentUserId || String(assignmentStudentId) === String(currentUserId) 
          });
            
          return assignmentStudentId && 
            (assignmentStudentId === currentUserId || 
             String(assignmentStudentId) === String(currentUserId));
        }) : [];
        
        console.log("Filtered student assignments:", myAssignments);
        setStudentAssignments(myAssignments);
        
        const materials = data.assignments ? data.assignments.filter(
          assignment => !assignment.studentId || assignment.isMaterial === true
        ) : [];
        console.log("Filtered course materials:", materials);
        setCourseMaterials(materials);
      } catch (error) {
        toast.error("Error loading course details");
        console.error("Error fetching course details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      console.log("File selected:", {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        lastModified: selectedFile.lastModified
      });
      
      setFile(selectedFile);
      setUploadError(null);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    setUploadError(null);
    console.log("Starting file upload process...");
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", courseId);
      
      // הוספת זמן שינוי אחרון של הקובץ
      if (file.lastModified) {
        formData.append("lastModified", file.lastModified.toString());
        console.log("Added lastModified:", new Date(file.lastModified).toISOString());
      }
      
      // הוספת מזהה סטודנט
      formData.append("studentId", localStorage.getItem("userId"));
      
      if (course && course.deadline) {
        formData.append("deadline", course.deadline);
      }
      
      if (uploadComment && uploadComment.trim()) {
        formData.append("comment", uploadComment.trim());
      }

      const response = await uploadAssignment(courseId, formData);
      console.log("Upload response received:", response.data);
      
      // הצגת הודעה פשוטה לסטודנט - רק על איחור
      if (response.data.isLate) {
        toast.warning("המטלה הוגשה באיחור.", {
          autoClose: 7000,
          icon: <Clock size={20} />,
        });
      } else {
        toast.success("המטלה הוגשה בהצלחה!", {
          autoClose: 3000,
        });
      }
      
      // רענון נתוני הקורס
      const { data } = await getCourseDetails(courseId);
      setCourse(data);
      
      // עדכון רשימת ההגשות
      const currentUserId = localStorage.getItem("userId");
      const updatedStudentAssignments = data.assignments.filter(assignment => {
        if (!assignment.studentId) return false;
        
        const assignmentStudentId = typeof assignment.studentId === 'object' ? 
            assignment.studentId._id || assignment.studentId : assignment.studentId;
        
        return assignmentStudentId && 
              (assignmentStudentId === currentUserId || 
               String(assignmentStudentId) === String(currentUserId));
      });
      
      setStudentAssignments(updatedStudentAssignments);
      
      // איפוס הטופס
      setFile(null);
      setUploadComment("");
      
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("שגיאה בהעלאת הקובץ. אנא נסה שוב.", {
        autoClose: 5000,
      });
      setUploadError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const confirmDeleteAssignment = (assignment) => {
    if (assignment.isLateSubmission) {
      toast.error("Late submissions cannot be deleted", {
        icon: <Clock size={24} />,
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
      const { data } = await getCourseDetails(courseId);
      setCourse(data);
      const currentUserId = localStorage.getItem("userId");
      const updatedStudentAssignments = data.assignments.filter(assignment => {
        if (!assignment.studentId) return false;
        
        const assignmentStudentId = typeof assignment.studentId === 'object' ? 
            assignment.studentId._id || assignment.studentId : assignment.studentId;
        
        return assignmentStudentId && 
              (assignmentStudentId === currentUserId || 
               String(assignmentStudentId) === String(currentUserId));
      });
      setStudentAssignments(updatedStudentAssignments);
      const materials = data.assignments.filter(assignment => 
        !assignment.studentId || assignment.isMaterial === true
      );
      setCourseMaterials(materials);
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
  
  const handleDownloadMaterial = async (assignment) => {
    try {
      if (!assignment || !assignment._id) {
        toast.error("Invalid file information");
        return false;
      }

      console.log("Downloading assignment:", assignment._id);
      const success = await downloadAssignment(
        courseId, 
        assignment._id,
        assignment.originalFileName || assignment.displayName || assignment.fileName
      );

      if (success) {
        toast.success("Download started");
        return true;
      } else {
        toast.error("Failed to download file");
        return false;
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Error downloading file");
      return false;
    }
  };

  if (loading) {
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

  if (!course) {
    return (
      <>
        <NavBar />
        <div className="courses-container">
          <Sidebar role="Student" />
          <div className="error-container">
            <Clock size={48} className="error-icon" />
            <h3>Course Not Found</h3>
            <p>The requested course could not be loaded.</p>
            <button className="back-btn" onClick={() => navigate("/student/my-courses")}>
              <ArrowLeft size={16} />
              Back to My Courses
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="courses-container">
        <Sidebar role="Student" />
        <div className="course-details-container">
          <CourseHeader courseName={course?.name} />
          
          <CourseInformation 
            creditPoints={course?.creditPoints}
            teacherName={teacherName}
            deadline={course?.deadline}
            course={course}
          />
          
          <CourseMaterials 
            materials={courseMaterials}
            onDownload={handleDownloadMaterial}
          />
          
          <AssignmentUpload 
            onFileChange={handleFileChange}
            onUpload={handleFileUpload}
            onCancel={() => { setFile(null); setUploadError(null); }}
            file={file}
            uploading={uploading}
            uploadComment={uploadComment}
            setUploadComment={setUploadComment}
            uploadError={uploadError}
          />
          
          <StudentSubmissions 
            assignments={studentAssignments}
            onDownload={handleDownloadMaterial}
            onDelete={(assignment) => confirmDeleteAssignment(assignment)}
            deadline={course?.deadline}
          />
          
          <DeleteConfirmationModal 
            isOpen={showConfirmDelete}
            onConfirm={handleDeleteAssignment}
            onCancel={() => setShowConfirmDelete(false)}
            fileName={assignmentToDelete?.fileName}
          />
        </div>
      </div>
    </>
  );
};

export default CourseDetails;