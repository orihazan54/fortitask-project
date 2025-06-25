import React from 'react';
import { FileText, Download, Trash2, Clock, Check, Info, AlertTriangle } from 'lucide-react';

const StudentSubmissions = ({ assignments, onDownload, onDelete, deadline }) => {
  const getFileIcon = (fileType) => {
    if (!fileType) return <FileText size={20} className="file-icon" />;
    if (fileType.includes("pdf")) return <FileText size={20} className="file-icon" />;
    if (fileType.includes("image")) return <FileText size={20} className="file-icon" />;
    if (fileType.includes("word") || fileType.includes("doc")) return <FileText size={20} className="file-icon" />;
    return <FileText size={20} className="file-icon" />;
  };

  const getStatusIcon = (assignment) => {
    if (assignment.isLateSubmission) {
      return <Clock size={18} className="status-icon late" title="Submitted late" style={{color: '#f59e0b'}} />;
    }
    return <Check size={18} className="status-icon on-time" title="Submitted on time" style={{color: '#10b981'}} />;
  };

  // מופיע לטובת חישוב משך האיחור – ימים ודקות – לפי דדליין הקורס
  const formatLateDuration = (uploadDate, courseDeadline) => {
    if (!courseDeadline || !uploadDate) return "";
    const diffMs = new Date(uploadDate) - new Date(courseDeadline);
    if (diffMs <= 0) return "";
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(" ");
  };

  const getStatusText = (assignment, courseDeadline) => {
    if (assignment.isLateSubmission) {
      const lateStr = formatLateDuration(assignment.uploadedAt, courseDeadline);
      return lateStr ? `Submitted late (${lateStr})` : "Submitted late";
    }
    return "Submitted on time";
  };

  return (
    <div className="student-assignments-section">
      <h3 className="section-title">Your Submissions</h3>
      {assignments.length > 0 ? (
        <ul className="student-assignments-list">
          {assignments.map((assignment, index) => (
            <li key={index} className="student-assignment-item">
              <div className="assignment-details">
                <div className="assignment-icon">
                  {getFileIcon(assignment.fileType)}
                </div>
                <div className="assignment-info">
                  <div className="assignment-header">
                    <span className="assignment-name">
                      {assignment.displayName || assignment.fileName || "Unnamed File"}
                    </span>
                    {assignment.studentName && (
                      <span className="student-name">
                        (<b>{assignment.studentName}</b>)
                      </span>
                    )}
                    {getStatusIcon(assignment)}
                  </div>
                  <div className="assignment-meta">
                    <span className="upload-date">
                      <Clock size={14} />
                      Submitted: {new Date(assignment.uploadedAt).toLocaleDateString()} {new Date(assignment.uploadedAt).toLocaleTimeString()}
                    </span>
                    
                    {/* הסתרת זמן עריכה אחרון לסטודנט */}
                    
                    <span className={`submission-status ${assignment.isLateSubmission ? 'status-late' : 'status-ok'}`}>
                      {getStatusText(assignment, deadline)}
                    </span>
                    
                    {assignment.submissionComment && (
                      <span className="submission-comment">
                        Comment: {assignment.submissionComment}
                      </span>
                    )}
                  </div>
                </div>
                <div className="assignment-actions">
                  <button 
                    className="btn download-btn" 
                    onClick={() => onDownload(assignment.fileUrl, assignment.displayName || assignment.fileName)}
                    title="Download"
                  >
                    <Download size={18} />
                  </button>
                  {!assignment.isLocked && (
                    <button 
                      className="btn delete-btn" 
                      onClick={() => onDelete(assignment)}
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
        <div className="empty-state">
          <Info size={48} className="empty-icon" />
          <h4>No Submissions Yet</h4>
          <p className="empty-description">You haven't submitted any assignments for this course yet.</p>
        </div>
      )}
    </div>
  );
};

export default StudentSubmissions;