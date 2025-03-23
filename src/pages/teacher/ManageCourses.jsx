
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { 
  getCourses, 
  deleteCourse, 
  updateCourse, 
  uploadAssignment, 
  deleteAssignment 
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
  Plus
} from "lucide-react";
import { Button } from "../../components/ui/button.jsx";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../../components/ui/card.jsx";
import "../../styles/ManageCourses.css";

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    creditPoints: "",
    instructions: "",
    deadline: "",
  });

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

  const handleSelectCourse = (courseId) => {
    const course = courses.find((c) => c._id === courseId);
    if (course) {
      setSelectedCourse(course);
      setIsEditing(false); // Reset the edit form when a new course is selected
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

    if (!window.confirm("האם אתה בטוח שברצונך למחוק קורס זה?")) {
      return;
    }

    try {
      await deleteCourse(selectedCourse._id);
      setCourses((prev) => prev.filter((course) => course._id !== selectedCourse._id));
      setSelectedCourse(null);
      setIsEditing(false);
      toast.success("הקורס נמחק בהצלחה!");
    } catch (error) {
      toast.error(error.response?.data?.message || "שגיאה במחיקת הקורס.");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.creditPoints || !formData.instructions || !formData.deadline) {
      toast.error("נא למלא את כל השדות הנדרשים.");
      return;
    }

    try {
      setUploading(true);
      
      // הכנת הטופס לשליחה עם כל הנתונים
      const courseFormData = new FormData();
      courseFormData.append("name", formData.name);
      courseFormData.append("creditPoints", formData.creditPoints);
      courseFormData.append("instructions", formData.instructions);
      courseFormData.append("deadline", formData.deadline);
      
      // הוספת הקובץ אם יש
      if (file) {
        courseFormData.append("file", file);
      }

      const { data } = await updateCourse(selectedCourse._id, courseFormData);
      setCourses((prev) =>
        prev.map((course) =>
          course._id === selectedCourse._id ? data : course
        )
      );
      toast.success("הקורס עודכן בהצלחה!");
      setSelectedCourse(data);
      setIsEditing(false);
      setFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "שגיאה בעדכון הקורס.");
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
      toast.error("נא לבחור קובץ להעלאה.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      await uploadAssignment(selectedCourse._id, formData);
      toast.success("המטלה הועלתה בהצלחה!");

      // רענון נתוני הקורס לאחר העלאה
      const { data } = await getCourses();
      setCourses(data || []);
      const updatedCourse = data && data.find(c => c._id === selectedCourse._id);
      setSelectedCourse(updatedCourse || null);
      setFile(null);
    } catch (error) {
      toast.error("שגיאה בהעלאת המטלה.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!selectedCourse) return;
    
    if (!window.confirm("האם אתה בטוח שברצונך למחוק מטלה זו?")) {
      return;
    }
    
    try {
      setDeleting(true);
      await deleteAssignment(selectedCourse._id, assignmentId);
      toast.success("המטלה נמחקה בהצלחה!");
      
      // רענון נתוני הקורס לאחר מחיקה
      const { data } = await getCourses();
      setCourses(data || []);
      const updatedCourse = data && data.find(c => c._id === selectedCourse._id);
      setSelectedCourse(updatedCourse || null);
    } catch (error) {
      toast.error(error.response?.data?.message || "שגיאה במחיקת המטלה.");
    } finally {
      setDeleting(false);
    }
  };

  const downloadAssignment = (fileUrl) => {
    window.open(fileUrl, "_blank");
  };

  // Safely access students array length
  const getStudentsCount = () => {
    return selectedCourse && selectedCourse.students ? selectedCourse.students.length : 0;
  };

  // Safely access assignments array
  const getAssignments = () => {
    return selectedCourse && selectedCourse.assignments ? selectedCourse.assignments : [];
  };

  return (
    <>
      <NavBar />
      <div className="manage-courses-container">
        <div className="header-section">
          <h2 className="dashboard-title">ניהול הקורסים שלך</h2>
          <Button 
            className="back-to-dashboard-btn" 
            variant="outline"
            onClick={() => (window.location.href = "/teacher-dashboard")}
          >
            <ArrowLeft size={16} />
            חזרה לדף הבית
          </Button>
        </div>

        <div className="content-section">
          <div className="courses-list">
            <Card>
              <CardHeader>
                <CardTitle>הקורסים שלך</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  className="course-dropdown"
                  onChange={(e) => handleSelectCourse(e.target.value)}
                  value={selectedCourse?._id || ""}
                >
                  <option value="">-- בחר קורס --</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
            
            {selectedCourse && !isEditing && (
              <Card className="course-details-card">
                <CardHeader>
                  <CardTitle>{selectedCourse.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="course-info">
                    <div className="info-item">
                      <CreditCard className="info-icon" />
                      <p>
                        <strong>נקודות זכות:</strong> {selectedCourse.creditPoints}
                      </p>
                    </div>
                    
                    <div className="info-item">
                      <Calendar className="info-icon" />
                      <p>
                        <strong>תאריך הגשה:</strong>{" "}
                        {new Date(selectedCourse.deadline).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="info-item">
                      <Users className="info-icon" />
                      <p>
                        <strong>סטודנטים רשומים:</strong> {getStudentsCount()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="card-actions">
                    <Button className="edit-btn" variant="default" onClick={handleEdit}>
                      ערוך קורס
                    </Button>
                    <Button className="delete-btn" variant="destructive" onClick={handleDelete}>
                      מחק קורס
                    </Button>
                  </div>

                  {/* הצגת המטלות שהועלו */}
                  <div className="assignments-section">
                    <h4 className="section-title">מטלות הקורס</h4>
                    {getAssignments().length > 0 ? (
                      <ul className="assignments-list">
                        {getAssignments().map((assignment, index) => (
                          <li key={index} className="assignment-item">
                            <div className="assignment-info">
                              <FileText size={18} />
                              <span className="file-name">{assignment.fileName}</span>
                            </div>
                            <div className="assignment-actions">
                              <button 
                                className="action-btn download-btn"
                                onClick={() => downloadAssignment(assignment.fileUrl)}
                                title="הורד מטלה"
                              >
                                <Download size={16} />
                              </button>
                              <button 
                                className="action-btn delete-btn"
                                onClick={() => handleDeleteAssignment(assignment._id)}
                                disabled={deleting}
                                title="מחק מטלה"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-assignments">אין מטלות שהועלו עדיין.</p>
                    )}
                  </div>

                  {/* אזור העלאת מטלה חדשה */}
                  <div className="upload-new-assignment">
                    <h4 className="section-title">העלאת מטלה חדשה</h4>
                    <div className="file-upload-box" onClick={() => document.getElementById('file-upload').click()}>
                      <label>
                        <Upload size={20} />
                        <span>בחר קובץ</span>
                        <input 
                          id="file-upload"
                          type="file" 
                          onChange={handleFileChange} 
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>
                    {file && (
                      <div className="selected-file">
                        <p>הקובץ שנבחר: {file.name}</p>
                        <Button 
                          className="upload-btn"
                          onClick={handleUploadAssignment}
                          disabled={uploading}
                        >
                          {uploading ? "מעלה..." : "העלה מטלה"}
                          <Plus size={16} />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {isEditing && (
            <Card className="edit-course-form">
              <CardHeader>
                <CardTitle>עריכת קורס</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="form-group">
                  <label>שם הקורס</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>נקודות זכות</label>
                  <input
                    type="number"
                    name="creditPoints"
                    value={formData.creditPoints}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>הנחיות</label>
                  <textarea
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleFormChange}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>תאריך הגשה</label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleFormChange}
                  />
                </div>
                
                {/* הוספת אזור העלאת קובץ */}
                <div className="form-group file-upload-section">
                  <label>העלאת מטלה (לא חובה)</label>
                  <div className="file-upload-box" onClick={() => document.getElementById('edit-file-upload').click()}>
                    <label>
                      <Upload size={20} />
                      <span>בחר קובץ</span>
                      <input 
                        id="edit-file-upload"
                        type="file" 
                        onChange={handleFileChange} 
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                  {file && <p className="selected-file-name">הקובץ שנבחר: {file.name}</p>}
                </div>
              </CardContent>
              <CardFooter>
                <div className="form-actions">
                  <Button 
                    className="save-btn" 
                    onClick={handleSave} 
                    disabled={uploading}
                  >
                    {uploading ? "שומר שינויים..." : "שמור שינויים"}
                  </Button>
                  <Button
                    className="cancel-btn"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFile(null);
                    }}
                  >
                    ביטול
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default ManageCourses;