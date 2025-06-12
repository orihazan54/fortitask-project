import React, { useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  ServerCrash,
  Shield,
} from "lucide-react";

/**
 * FileMetaAnalyzer: 
 * רכיב לבדיקת מטא-דטה של קבצים והצגה מקצועית עבור מרצה בלבד.
 * מציג סטטוס, השוואות, ומפעיל alert כאשר יש חשש לרמאות או שינוי אחרי דדליין.
 */
function FileMetaAnalyzer({ file, fileMeta, deadline }) {
  // Move all useMemo hooks to the top level - they will return undefined values if dependencies are missing
  const lastModified = useMemo(() => 
    fileMeta?.lastModifiedUTC ? new Date(fileMeta.lastModifiedUTC) : (fileMeta?.lastModified ? new Date(fileMeta.lastModified) : null),
    [fileMeta]
  );
  
  const clientReportedDate = useMemo(() => 
    fileMeta?.clientReportedDate ? new Date(fileMeta.clientReportedDate) : null, 
    [fileMeta]
  );
  
  const deadlineDate = useMemo(() => 
    deadline ? new Date(deadline) : null, 
    [deadline]
  );
  
  const localDisplayTime = useMemo(() => new Date(), []); 

  // This is the server-provided flag and should be the primary source of truth for suspected manipulation
  const isSuspectedTimeManipulationByServer = useMemo(() => 
    fileMeta?.suspectedTimeManipulation === true,
    [fileMeta]
  );

  // Calculate the specific time difference to display in the alert message
  // This should be the difference that LED to one of the suspicion flags, or a general one.
  // For the message "הפרש של X דקות בין זמן המערכת לזמן הקובץ", 
  // "זמן המערכת" is ambiguous. Let's use clientReportedDate vs uploadedAt (server time of upload).
  const displayedTimeDifferenceMinutes = useMemo(() => {
    if (fileMeta?.clientReportedDate && fileMeta?.uploadedAt) {
      const clientTime = new Date(fileMeta.clientReportedDate);
      const uploadTime = new Date(fileMeta.uploadedAt);
      const diffMs = Math.abs(uploadTime.getTime() - clientTime.getTime());
      return Math.round(diffMs / (60 * 1000)); // Difference in minutes
    }
    return null; // Or some default like 0 if one of the dates is missing
  }, [fileMeta?.clientReportedDate, fileMeta?.uploadedAt]);

  // This client-side check for large discrepancies can remain as a secondary indicator or for UI purposes,
  // but the server's flag is primary for logic.
  const hasSignificantClientServerTimeDiff = useMemo(() => {
    if (!clientReportedDate || !localDisplayTime) return false;
    const timeDifference = Math.abs(localDisplayTime.getTime() - clientReportedDate.getTime());
    // This is a very large diff, indicating client's clock might be way off from user viewing the analysis.
    // The server-side check (clientReported vs serverNOW at upload) is more critical for manipulation detection.
    return timeDifference > (2 * 60 * 60 * 1000); 
  }, [clientReportedDate, localDisplayTime]);

  const isLateSubmission = useMemo(() => 
    fileMeta?.isLateSubmission === true, 
    [fileMeta]
  );

  const isModifiedBeforeButSubmittedLate = useMemo(() => {
    // Rely on server flag if available
    if (typeof fileMeta?.isModifiedBeforeButSubmittedLate === 'boolean') {
      return fileMeta.isModifiedBeforeButSubmittedLate;
    }
    // Fallback computation based only on client time and flags
    if (!isLateSubmission || !deadlineDate || !clientReportedDate) return false;
    // Only consider this valid if NO manipulation is suspected
    if (isSuspectedTimeManipulationByServer) return false;
    return clientReportedDate <= deadlineDate;
  }, [isLateSubmission, clientReportedDate, deadlineDate, isSuspectedTimeManipulationByServer, fileMeta]);

  const statusColor = useMemo(() => {
    if (isSuspectedTimeManipulationByServer) return "#ea384c"; // Red - Server suspects manipulation
    if (isModifiedBeforeButSubmittedLate) return "#f59e0b"; 
    return "#10b981"; 
  }, [isSuspectedTimeManipulationByServer, isModifiedBeforeButSubmittedLate]);

  // לוגיקה חדשה לזיהוי מניפולציה
  const serverUploadTime = useMemo(() => fileMeta?.uploadedAt ? new Date(fileMeta.uploadedAt) : null, [fileMeta]);
  const MAX_ALLOWED_TIME_DIFFERENCE_MIN = 24 * 60; // 24 שעות

  // מניפולציה: זמן עריכה בעתיד
  const isManipulationFuture = useMemo(() => lastModified && serverUploadTime && lastModified > serverUploadTime, [lastModified, serverUploadTime]);
  // מניפולציה: הפרש קיצוני (שעון הוזז אחורה)
  const isManipulationClockBack = useMemo(() => lastModified && serverUploadTime && lastModified < deadlineDate && (serverUploadTime.getTime() - lastModified.getTime()) / (60 * 1000) > MAX_ALLOWED_TIME_DIFFERENCE_MIN, [lastModified, serverUploadTime, deadlineDate]);
  // האם הקובץ נערך אחרי הדדליין
  const isModifiedAfterDeadline = useMemo(() => lastModified && deadlineDate && lastModified > deadlineDate, [lastModified, deadlineDate]);

  // סטטוס סופי
  const statusText = useMemo(() => {
    if (isManipulationFuture) return "Suspected manipulation: file last modified in the future (clock set forward)";
    if (isManipulationClockBack) return "Suspected manipulation: file last modified long before submission (clock set back)";
    if (isModifiedAfterDeadline) return "Late submission: file was modified after the deadline";
    if (isLateSubmission && isModifiedAfterDeadline) return "Late submission AND modified after deadline";
    if (isLateSubmission) return "Late submission: file was last modified before the deadline";
    return "On time submission";
  }, [isManipulationFuture, isManipulationClockBack, isModifiedAfterDeadline, isLateSubmission]);

  // 🕒 חישוב משך האיחור בהגשה (upload מול deadline)
  const submissionLateDurationText = useMemo(() => {
    if (!isLateSubmission || !serverUploadTime || !deadlineDate) return null;
    const diffMs = serverUploadTime.getTime() - deadlineDate.getTime();
    if (diffMs <= 0) return null;
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.join(" ");
  }, [isLateSubmission, serverUploadTime, deadlineDate]);

  // 🕒 חישוב משך האיחור (ימים + דקות) כאשר הקובץ נערך אחרי הדדליין
  const lateDurationText = useMemo(() => {
    if (!isModifiedAfterDeadline || !lastModified || !deadlineDate) return null;
    const diffMs = lastModified.getTime() - deadlineDate.getTime();
    if (diffMs <= 0) return null;
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.join(" ");
  }, [isModifiedAfterDeadline, lastModified, deadlineDate]);

  // Early return after all hooks are called
  if (!file || !fileMeta || !deadline || !deadlineDate) {
    return null;
  }

  // פורמט תאריך לתצוגה ידידותית למשתמש
  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      // Example: "12/12/2023, 10:30:00 AM" - adjust options as needed
      return new Date(date).toLocaleString(undefined, { 
        year: 'numeric', month: 'numeric', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
      });
    } catch (e) {
      console.error("Error formatting date:", e, "Input date:", date);
      return "Invalid date";
    }
  };

  return (
    <div
      className="file-meta-analyzer animate-fade-in"
      style={{
        background: "#F1F0FB",
        border: `2px solid ${statusColor}`,
        borderRadius: "1rem",
        padding: "1.5rem",
        margin: "1.5rem 0",
        boxShadow: "0 2px 18px #00000010",
        fontFamily: "Inter, 'Assistant', sans-serif",
        maxWidth: 600,
      }}
    >
      <div
        style={{
          marginBottom: "0.75rem",
          fontWeight: 700,
          color: statusColor,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 20,
        }}
      >
        <Info size={24} /> File Metadata Analysis
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          rowGap: 10,
          columnGap: 26,
          alignItems: "center",
          fontSize: 16,
        }}
      >
        <div style={{ color: "#7E69AB", textAlign: "right" }}>
          <Calendar size={16} style={{ verticalAlign: "middle" }} />
          <span style={{ marginLeft: 5 }}>Deadline</span>
        </div>
        <div>
          <span style={{ color: "#1A1F2C", fontWeight: 600 }}>
            {formatDate(deadlineDate)}
          </span>
        </div>

        <div style={{ color: "#7E69AB", textAlign: "right" }}>
          <Clock size={16} style={{ verticalAlign: "middle" }} />
          <span style={{ marginLeft: 5 }}>Last Modified (Client Reported)</span>
        </div>
        <div>
          <span style={{ 
            color: isSuspectedTimeManipulationByServer ? "#ea384c" : "#1A1F2C", 
            fontWeight: isSuspectedTimeManipulationByServer ? 700 : 600 
          }}>
            {formatDate(clientReportedDate)}
            {isSuspectedTimeManipulationByServer && (
              <span style={{ marginLeft: 10, color: "#ea384c", fontWeight: 700 }}>
                <AlertTriangle size={18} style={{ verticalAlign: "middle" }} /> 
                Suspicious time difference detected
              </span>
            )}
          </span>
        </div>

        <div style={{ color: "#7E69AB", textAlign: "right" }}>
          <ServerCrash size={16} style={{ verticalAlign: "middle" }} />
          <span style={{ marginLeft: 5 }}>Analysis Time (Local)</span>
        </div>
        <div>
          <span style={{ color: "#1A1F2C" }}>{formatDate(localDisplayTime)}</span>
        </div>

        {isSuspectedTimeManipulationByServer && (
          <div style={{ color: "#ea384c", textAlign: "right", gridColumn: "1/-1", background: "#FFE8E8", padding: "8px 12px", borderRadius: "6px", marginTop: "10px" }}>
            <AlertTriangle size={18} style={{ verticalAlign: "middle" }} />
            <span style={{ marginRight: 5, fontWeight: "bold" }}>
              חשד למניפולציית זמן! הפרש חריג בין זמני המערכת והקובץ.
            </span>
            {displayedTimeDifferenceMinutes !== null && (
              <div style={{ fontSize: "14px", marginTop: "4px"}}>
                הפרש של {displayedTimeDifferenceMinutes} דקות בין זמן העריכה המדווח (קובץ) לזמן ההגשה (שרת).
              </div>
            )}
          </div>
        )}

        {submissionLateDurationText && (
          <div style={{ color: "#b45309", textAlign: "left", gridColumn: "1/-1", background: "#FFF8E6", padding: "8px 12px", borderRadius: "6px", marginTop: "10px", fontWeight: 600 }}>
            <Clock size={18} style={{ verticalAlign: "middle" }} />
            <span style={{ marginLeft: 6 }}>
              Submission delay: {submissionLateDurationText}
            </span>
          </div>
        )}

        {/* File last modified row */}
        <div style={{ color: "#7E69AB", textAlign: "right", marginTop: 10 }}>
          <Clock size={16} style={{ verticalAlign: "middle" }} />
          <span style={{ marginLeft: 5 }}>File Last Modified</span>
        </div>
        <div>
          <span style={{ color: "#1A1F2C", fontWeight: 600 }}>{formatDate(lastModified)}</span>
        </div>

        <div style={{ color: "#7E69AB", textAlign: "right" }}>
          <Info size={16} style={{ verticalAlign: "middle" }} />
          <span style={{ marginLeft: 5 }}>Submission Status</span>
        </div>
        <div>
          <span style={{ color: statusColor, fontWeight: 700 }}>
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
}

export default FileMetaAnalyzer;