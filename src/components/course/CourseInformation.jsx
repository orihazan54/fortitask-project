
import React from 'react';
import { Calendar, Clock } from 'lucide-react';

const CourseInformation = ({ creditPoints, teacherName, deadline, course }) => {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const timeRemaining = deadlineDate - now;
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const isDeadlinePassed = timeRemaining < 0;

  // פורמט התאריך והשעה בצורה ידידותית למשתמש
  const formatDate = (date) => {
    return date.toLocaleDateString();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
              <div className="deadline-date-time">
                <span className="deadline-date">
                  <Calendar size={16} className="icon" />
                  {formatDate(deadlineDate)}
                </span>
                <span className="deadline-time">
                  <Clock size={16} className="icon" />
                  {formatTime(deadlineDate)}
                </span>
              </div>
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
        {isDeadlinePassed && (
          <div className="deadline-note">
            <p><b>Note:</b> The deadline for this course has passed. You may still submit files, and if they were modified before the deadline but submitted late, they will be marked accordingly.</p>
            <p><b>Important:</b> Files that were modified after the deadline will be clearly marked, and date manipulation will be detected.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseInformation;