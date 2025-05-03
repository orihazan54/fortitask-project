
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CourseHeader = ({ courseName }) => {
  const navigate = useNavigate();

  return (
    <div className="course-header">
      <button className="back-btn" onClick={() => navigate("/student/my-courses")}>
        <ArrowLeft size={16} />
        Back to My Courses
      </button>
      <h2 className="course-title">{courseName}</h2>
    </div>
  );
};

export default CourseHeader;