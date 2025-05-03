
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
function FileMetaAnalyzer({ file, fileMeta, deadline, onCheatingDetected }) {
  // Move all useMemo hooks to the top level - they will return undefined values if dependencies are missing
  const lastModified = useMemo(() => 
    fileMeta ? new Date(fileMeta.lastModifiedUTC || fileMeta.lastModified) : null, 
    [fileMeta]
  );
  
  const clientReportedDate = useMemo(() => 
    fileMeta && fileMeta.clientReportedDate ? new Date(fileMeta.clientReportedDate) : null, 
    [fileMeta]
  );
  
  const deadlineDate = useMemo(() => 
    deadline ? new Date(new Date(deadline).toISOString()) : null, 
    [deadline]
  );
  
  const nowUTC = useMemo(() => 
    new Date(new Date().toISOString()), 
    []
  );

  // בדיקת הפרשי זמנים חשודים
  const timeDifference = useMemo(() => {
    if (!lastModified) return 0;
    return Math.abs(nowUTC - lastModified);
  }, [lastModified, nowUTC]);

  const isPossibleTimeManipulation = useMemo(() => 
    timeDifference > 3600000, // הפרש של יותר משעה נחשב חשוד
    [timeDifference]
  );

  // Calculate these values only if we have valid dates
  const isModifiedAfterDeadline = useMemo(() => 
    lastModified && deadlineDate ? lastModified > deadlineDate : false, 
    [lastModified, deadlineDate]
  );
  
  const isLateSubmission = useMemo(() => 
    nowUTC && deadlineDate ? nowUTC > deadlineDate : false,
    [nowUTC, deadlineDate]
  );

  // Detecting difference between client reported date and actual date
  const clientServerTimeDiff = useMemo(() => {
    if (!clientReportedDate || !lastModified) return 0;
    return Math.abs(clientReportedDate - lastModified);
  }, [clientReportedDate, lastModified]);

  const hasDateDiscrepancy = useMemo(() => 
    clientServerTimeDiff > 60000, // More than 1 minute difference is suspicious
    [clientServerTimeDiff]
  );

  // Always call useEffect at the top level
  useEffect(() => {
    if ((isModifiedAfterDeadline || isPossibleTimeManipulation || hasDateDiscrepancy) && file && typeof onCheatingDetected === "function") {
      onCheatingDetected({
        fileName: file.name,
        lastModified: lastModified?.toUTCString(),
        clientReportedDate: clientReportedDate?.toUTCString(),
        deadline: deadlineDate?.toUTCString(),
        suspectedTimeManipulation: isPossibleTimeManipulation,
        hasDateDiscrepancy,
        timeDifference
      });
    }
  }, [isModifiedAfterDeadline, isPossibleTimeManipulation, hasDateDiscrepancy, file, lastModified, clientReportedDate, deadlineDate, onCheatingDetected, timeDifference, clientServerTimeDiff]);

  // Status color based on conditions
  const statusColor = isModifiedAfterDeadline || isPossibleTimeManipulation || hasDateDiscrepancy
    ? "#ea384c" // אדום - רמאות או בעיה
    : isLateSubmission
    ? "#f59e0b" // כתום - איחור
    : "#10b981"; // ירוק - תקין

  // Early return after all hooks are called
  if (!file || !fileMeta || !deadline || !lastModified || !deadlineDate) {
    return null;
  }

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
            {deadlineDate.toUTCString()}
          </span>
        </div>

        <div style={{ color: "#7E69AB", textAlign: "right" }}>
          <Clock size={16} style={{ verticalAlign: "middle" }} />
          <span style={{ marginLeft: 5 }}>Client Reported Last Modified</span>
        </div>
        <div>
          <span style={{ 
            color: hasDateDiscrepancy ? "#ea384c" : "#1A1F2C", 
            fontWeight: hasDateDiscrepancy ? 700 : 600 
          }}>
            {clientReportedDate ? clientReportedDate.toUTCString() : "Not available"}
            {hasDateDiscrepancy && (
              <span style={{ marginLeft: 10, color: "#ea384c", fontWeight: 700 }}>
                <AlertTriangle size={18} style={{ verticalAlign: "middle" }} /> 
                Client date suspicious!
              </span>
            )}
          </span>
        </div>

        <div style={{ color: "#7E69AB", textAlign: "right" }}>
          <Shield size={16} style={{ verticalAlign: "middle" }} />
          <span style={{ marginLeft: 5 }}>Server Verified Last Modified (UTC)</span>
        </div>
        <div>
          <span style={{ color: isModifiedAfterDeadline ? "#ea384c" : "#1A1F2C", fontWeight: 600 }}>
            {lastModified.toUTCString()}
            {isModifiedAfterDeadline && (
              <span style={{ marginLeft: 10, color: "#ea384c", fontWeight: 700 }}>
                <AlertTriangle size={18} style={{ verticalAlign: "middle" }} /> 
                Modified after deadline!
              </span>
            )}
          </span>
        </div>

        <div style={{ color: "#7E69AB", textAlign: "right" }}>
          <ServerCrash size={16} style={{ verticalAlign: "middle" }} />
          <span style={{ marginLeft: 5 }}>Server Time (UTC)</span>
        </div>
        <div>
          <span style={{ color: "#1A1F2C" }}>{nowUTC.toUTCString()}</span>
        </div>

        {isPossibleTimeManipulation && (
          <>
            <div style={{ color: "#ea384c", textAlign: "right", gridColumn: "1/-1", background: "#FFE8E8", padding: "8px 12px", borderRadius: "6px" }}>
              <AlertTriangle size={18} style={{ verticalAlign: "middle" }} />
              <span style={{ marginRight: 5, fontWeight: "bold" }}>
                חשד למניפולציה של זמנים! הפרש חריג בין זמני המערכת והקובץ
              </span>
              <div style={{ fontSize: "14px", marginTop: "4px"}}>
                הפרש של {Math.round(timeDifference / 1000 / 60)} דקות בין זמן המערכת לזמן הקובץ.
              </div>
            </div>
          </>
        )}

        {hasDateDiscrepancy && (
          <>
            <div style={{ color: "#ea384c", textAlign: "right", gridColumn: "1/-1", background: "#FFE8E8", padding: "8px 12px", borderRadius: "6px" }}>
              <AlertTriangle size={18} style={{ verticalAlign: "middle" }} />
              <span style={{ marginRight: 5, fontWeight: "bold" }}>
                זמן שונה מדווח על ידי המשתמש! הפרש של {Math.round(clientServerTimeDiff / 1000 / 60)} דקות בין הזמן המדווח לזמן האמיתי
              </span>
            </div>
          </>
        )}

        <div style={{ color: "#7E69AB", textAlign: "right" }}>
          <Info size={16} style={{ verticalAlign: "middle" }} />
          <span style={{ marginLeft: 5 }}>Submission Status</span>
        </div>
        <div>
          {!isLateSubmission && !isModifiedAfterDeadline && !isPossibleTimeManipulation && !hasDateDiscrepancy && (
            <span style={{ color: "#10b981", fontWeight: 600 }}>
              <CheckCircle size={18} style={{ verticalAlign: "middle" }} /> On time, not modified after deadline
            </span>
          )}
          {isLateSubmission && !isModifiedAfterDeadline && !isPossibleTimeManipulation && !hasDateDiscrepancy && (
            <span style={{ color: "#f59e0b", fontWeight: 600 }}>
              <AlertTriangle size={18} style={{ verticalAlign: "middle" }} /> 
              Submitted after deadline (but file was not modified after deadline)
            </span>
          )}
          {isModifiedAfterDeadline && (
            <span style={{ color: "#ea384c", fontWeight: 700 }}>
              <AlertTriangle size={20} style={{ verticalAlign: "middle" }} /> 
              File was modified after deadline!
            </span>
          )}
          {isPossibleTimeManipulation && (
            <span style={{ color: "#ea384c", fontWeight: 700, display: "block", marginTop: "5px" }}>
              <AlertTriangle size={20} style={{ verticalAlign: "middle" }} /> 
              Suspected time manipulation detected!
            </span>
          )}
          {hasDateDiscrepancy && !isPossibleTimeManipulation && !isModifiedAfterDeadline && (
            <span style={{ color: "#ea384c", fontWeight: 700, display: "block", marginTop: "5px" }}>
              <AlertTriangle size={20} style={{ verticalAlign: "middle" }} /> 
              Client reported date differs from server verified date!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileMetaAnalyzer;