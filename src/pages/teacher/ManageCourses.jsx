import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getCourses, deleteCourse, updateCourse } from "../../services/api";
import NavBar from "../../components/NavBar";
import "../../styles/ManageCourses.css";

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    creditPoints: "",
    instructions: "",
    deadline: "",
    file: null,
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await getCourses();
        setCourses(data);
      } catch (error) {
        toast.error("Failed to fetch courses.");
      }
    };

    fetchCourses();
  }, []);

  const handleDelete = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) {
      return;
    }

    try {
      await deleteCourse(courseId);
      setCourses(courses.filter((course) => course._id !== courseId));
      toast.success("Course deleted successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete course.");
    }
  };

  const handleEditClick = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      creditPoints: course.creditPoints,
      instructions: course.instructions,
      deadline: new Date(course.deadline).toISOString().split("T")[0],
      file: null,
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.creditPoints || !formData.instructions || !formData.deadline) {
      toast.error("Please fill out all required fields.");
      return;
    }

    const updatedData = new FormData();
    updatedData.append("name", formData.name);
    updatedData.append("creditPoints", formData.creditPoints);
    updatedData.append("instructions", formData.instructions);
    updatedData.append("deadline", formData.deadline);
    if (formData.file) {
      updatedData.append("file", formData.file);
    }

    try {
      const { data } = await updateCourse(editingCourse._id, updatedData);
      setCourses((prev) =>
        prev.map((course) => (course._id === editingCourse._id ? data : course))
      );
      toast.success("Course updated successfully!");
      setEditingCourse(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update course.");
    }
  };

  return (
    <>
      <NavBar />
      <div className="manage-courses-container">
        <div className="header-section">
          <h2>Manage Your Courses</h2>
          <button
            className="btn back-to-dashboard-btn"
            onClick={() => (window.location.href = "/teacher-dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>

        {editingCourse ? (
          <div className="edit-course-form">
            <h3>Edit Course</h3>
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
            <div className="form-group">
              <label>Upload New File (Optional)</label>
              <input type="file" name="file" onChange={handleFileChange} />
            </div>
            <div className="form-actions">
              <button className="btn save-btn" onClick={handleSave}>
                Save Changes
              </button>
              <button
                className="btn cancel-btn"
                onClick={() => setEditingCourse(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="courses-list">
            {courses.length === 0 ? (
              <p className="no-courses">No courses available.</p>
            ) : (
              courses.map((course) => (
                <div key={course._id} className="course-card">
                  <h3>{course.name}</h3>
                  <p>
                    <strong>Credits:</strong> {course.creditPoints}
                  </p>
                  <p>
                    <strong>Deadline:</strong>{" "}
                    {new Date(course.deadline).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Students:</strong> {course.students.length}
                  </p>
                  <div className="card-actions">
                    <button
                      className="btn edit-btn"
                      onClick={() => handleEditClick(course)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn delete-btn"
                      onClick={() => handleDelete(course._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ManageCourses;
