import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getCourses, deleteCourse, updateCourse } from "../../services/api";
import NavBar from "../../components/NavBar";
import "../../styles/ManageCourses.css";

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
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
        setCourses(data);
      } catch (error) {
        toast.error("Failed to fetch courses.");
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
      name: selectedCourse.name,
      creditPoints: selectedCourse.creditPoints,
      instructions: selectedCourse.instructions,
      deadline: new Date(selectedCourse.deadline).toISOString().split("T")[0],
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
      toast.error(error.response?.data?.message || "Failed to delete course.");
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.creditPoints || !formData.instructions || !formData.deadline) {
      toast.error("Please fill out all required fields.");
      return;
    }

    const updatedData = {
      name: formData.name,
      creditPoints: formData.creditPoints,
      instructions: formData.instructions,
      deadline: formData.deadline,
    };

    try {
      const { data } = await updateCourse(selectedCourse._id, updatedData);
      setCourses((prev) =>
        prev.map((course) =>
          course._id === selectedCourse._id ? data : course
        )
      );
      toast.success("Course updated successfully!");
      setSelectedCourse(data);
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update course.");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

        <div className="content-section">
          {!selectedCourse ? (
            <div className="courses-list">
              <h3>Your Courses</h3>
              <select
                className="course-dropdown"
                onChange={(e) => handleSelectCourse(e.target.value)}
              >
                <option value="">-- Select a Course --</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="course-details">
              <h3>{selectedCourse.name}</h3>
              <p>
                <strong>Credits:</strong> {selectedCourse.creditPoints}
              </p>
              <p>
                <strong>Deadline:</strong>{" "}
                {new Date(selectedCourse.deadline).toLocaleDateString()}
              </p>
              <p>
                <strong>Students:</strong> {selectedCourse.students.length}
              </p>
              <div className="card-actions">
                <button className="btn edit-btn" onClick={handleEdit}>
                  Edit
                </button>
                <button className="btn delete-btn" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            </div>
          )}

          {isEditing && (
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
              <div className="form-actions">
                <button className="btn save-btn" onClick={handleSave}>
                  Save Changes
                </button>
                <button
                  className="btn cancel-btn"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ManageCourses;
