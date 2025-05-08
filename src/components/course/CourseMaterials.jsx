
import React from 'react';
import { FileText, Download, Info, Clock } from 'lucide-react';

const CourseMaterials = ({ materials, onDownload }) => {
  const formatFileSize = (sizeInBytes) => {
    if (!sizeInBytes) return "Unknown size";
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <FileText size={20} />;
    if (fileType.includes("pdf")) return <FileText size={20} />;
    if (fileType.includes("image")) return <FileText size={20} />;
    if (fileType.includes("word") || fileType.includes("doc")) return <FileText size={20} />;
    return <FileText size={20} />;
  };

  return (
    <div className="materials-section">
      <h3 className="section-title">Course Materials</h3>
      {materials && materials.length > 0 ? (
        <ul className="materials-list">
          {materials.map((material, index) => (
            <li key={index} className="material-item">
              <div className="material-details">
                <div className="material-icon">
                  {getFileIcon(material.fileType)}
                </div>
                <div className="material-info">
                  <span className="material-name">
                    {material.displayName || material.fileName || "Unnamed File"}
                  </span>
                  <div className="material-meta">
                    {material.uploadedAt && (
                      <span className="upload-date">
                        <Clock size={14} />
                        Uploaded: {new Date(material.uploadedAt).toLocaleDateString()}
                      </span>
                    )}
                    {material.originalSize && (
                      <span className="file-size">
                        Size: {formatFileSize(material.originalSize)}
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  className="download-btn" 
                  onClick={() => onDownload(material)}
                  aria-label={`Download ${material.displayName || material.fileName || "file"}`}
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <Info size={48} className="empty-icon" />
          <h4>No Materials Available</h4>
          <p className="empty-description">The instructor hasn't uploaded any course materials yet.</p>
        </div>
      )}
    </div>
  );
};

export default CourseMaterials;