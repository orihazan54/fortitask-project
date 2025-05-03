
import React from 'react';
import { Upload, AlertTriangle } from 'lucide-react';

const AssignmentUpload = ({ 
  onFileChange, 
  onUpload, 
  onCancel, 
  file, 
  uploading,
  uploadComment,
  setUploadComment,
  uploadError
}) => {
  const formatFileSize = (sizeInBytes) => {
    if (!sizeInBytes) return "Unknown size";
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="upload-section">
      <h3 className="section-title">
        <Upload size={20} className="section-icon" />
        Submit Your Assignment
      </h3>
      <div className={`file-upload-box`}>
        <label>
          <div className="upload-inner">
            <Upload size={24} />
            <span>Choose a file to upload</span>
            <input 
              type="file" 
              onChange={onFileChange} 
              style={{ display: "none" }}
            />
          </div>
        </label>
      </div>
      {uploadError && (
        <div className="upload-error-message">
          <AlertTriangle size={16} />
          {uploadError}
        </div>
      )}
      {file && (
        <div className="selected-file">
          <p>
            Selected file: {file.name} ({formatFileSize(file.size)})
          </p>
          <div className="comment-input">
            <label htmlFor="upload-comment">Comment (optional):</label>
            <textarea
              id="upload-comment"
              value={uploadComment}
              onChange={(e) => setUploadComment(e.target.value)}
              placeholder="Add a comment about your submission"
              rows={2}
            />
          </div>
          <div className="file-upload-actions">
            <button 
              className="btn upload-btn" 
              onClick={onUpload}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
            <button 
              className="btn cancel-btn" 
              onClick={onCancel}
              disabled={uploading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentUpload;