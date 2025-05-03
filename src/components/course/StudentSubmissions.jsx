
import React from 'react';
import { FileText, Download, Trash2, Clock, AlertTriangle, Check, Info } from 'lucide-react';

const StudentSubmissions = ({ assignments, onDownload, onDelete }) => {
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
                      Submitted: {new Date(assignment.uploadedAt).toLocaleDateString()}
                    </span>
                    {assignment.lastModified && (
                      <span className="modified-date">
                        Last modified: {new Date(assignment.lastModified).toLocaleDateString()}
                      </span>
                    )}
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
                  {!assignment.isLateSubmission && (
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