
import React from 'react';
import { Calendar } from 'lucide-react';

const CourseInformation = ({ creditPoints, teacherName, deadline, course }) => {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const timeRemaining = deadlineDate - now;
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const isDeadlinePassed = timeRemaining < 0;

  return (
    <div className="course-info-grid">
      <div className="course-info-card">
        <h3 className="card-title">Course Information</h3>
        <div className="info-item">
          <span className="info-label">Credits:</span>
          <span className="info-value">{creditPoints}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Instructor:</span>
          <span className="info-value">{teacherName}</span>
        </div>
        <div className="info-item deadline-info">
          <span className="info-label">Deadline:</span>
          {deadline && (
            <span className={`info-value ${isDeadlinePassed ? 'deadline-passed' : ''}`}>
              <Calendar size={16} className="icon" />
              {deadlineDate.toLocaleDateString()}
              {!isDeadlinePassed ? (
                <span className="time-remaining">
                  ({daysRemaining} days and {hoursRemaining} hours left)
                </span>
              ) : (
                <span className="deadline-passed-text">Deadline has passed</span>
              )}
            </span>
          )}
        </div>
      </div>
      
      <div className="course-info-card instructions-card">
        <h3 className="card-title">Instructions</h3>
        <p className="instructions-text">
          {course?.instructions || "No instructions provided for this course."}
        </p>
      </div>
    </div>
  );
};

export default CourseInformation;