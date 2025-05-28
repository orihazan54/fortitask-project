require("dotenv").config();
const { cloudinary } = require("./config/cloudinary");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const { exec } = require('child_process');

// ייבוא מסלולים
const userRoutes = require("./routes/userRoutes");
const coursesRoutes = require("./routes/coursesRoutes"); // מיזוג משימות וקורסים

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // מאפשר עבודה עם JSON בבקשות עם גודל מוגדל
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// שימוש בתיקיית uploads כסטטית
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// לוג של סטטוס התחברות לcloudinary
console.log("✅ Cloudinary Config:");
console.log("CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API_KEY:", process.env.CLOUDINARY_API_KEY ? "Loaded" : "Missing");
console.log("API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "Loaded" : "Missing");

// חיבור ל-MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ Error connecting to MongoDB:", err));

// מסלולים
app.use("/api/users", userRoutes); // מסלולים עבור משתמשים
app.use("/api/courses", coursesRoutes); // מסלולים עבור קורסים ומשימות

// הוספת הגשת קבצים סטטיים עבור ה-frontend
// ודא שתיקיית ה-build של ה-frontend נמצאת בנתיב הנכון יחסית לשרת
const frontendBuildPath = path.join(__dirname, '../build');
app.use(express.static(frontendBuildPath));

// מסלול בדיקה
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// טיפול בקבצי מטא-דאטה - גרסה מתוקנת עם הגיון משופר ובדיקות מדויקות יותר
app.post("/api/analyze-metadata", (req, res) => {
  try {
    const { fileData, deadline } = req.body;
    if (!fileData) {
      return res.status(400).json({ message: "No file data provided" });
    }
    
    console.log("Analyzing file metadata:", {
      name: fileData.name,
      size: fileData.size,
      lastModified: fileData.lastModified
    });
    
    // Extract metadata from file
    const { lastModified, name, size, type } = fileData;
    
    // Save client reported date - חובה לשמור את התאריך שמדווח על ידי הלקוח
    const clientReportedDate = lastModified ? new Date(lastModified) : null;
    
    // Get current server time for comparison
    const serverTime = new Date();
    
    // Calculate time difference only if client reported a date
    let timeDifference = 0;
    let possibleManipulation = false;
    
    if (clientReportedDate) {
      timeDifference = Math.abs(serverTime - clientReportedDate);
      // אם הפרש הזמנים גדול מדי (יותר משעתיים), זה עשוי להצביע על מניפולציה
      possibleManipulation = timeDifference > 7200000; // 2 hours in milliseconds
      console.log(`Time difference: ${timeDifference / 1000 / 60} minutes, Possible manipulation: ${possibleManipulation}`);
    } else {
      console.log("No client reported date available");
    }
    
    // בגרסה המשופרת אנחנו מתייחסים לתאריך העריכה האחרון כפי שדווח מהלקוח כאמין
    // אלא אם כן יש אינדיקציה לרמאות
    const serverVerifiedModified = clientReportedDate || new Date();
    
    // בדיקת הפער בין התאריך המדווח ע"י הלקוח לבין התאריך של השרת
    const clientServerDiscrepancy = clientReportedDate ? Math.abs(clientReportedDate - serverTime) : 0;
    const hasDateDiscrepancy = clientServerDiscrepancy > 60000 && clientServerDiscrepancy > 7200000; // הפרש של יותר מדקה ויותר משעתיים
    
    // Get deadline for comparison (if provided)
    let deadlineDate = null;
    let isLateSubmission = false;
    let isModifiedAfterDeadline = false;
    let isModifiedBeforeButSubmittedLate = false;
    
    if (deadline) {
      deadlineDate = new Date(deadline);
      console.log(`Deadline: ${deadlineDate.toISOString()}`);
      
      // בדיקה אם ההגשה מאוחרת - האם זמן השרת הנוכחי מאוחר מהדדליין
      isLateSubmission = serverTime > deadlineDate;
      
      // בדיקה אם הקובץ נערך אחרי הדדליין - תלוי בתאריך העריכה המאומת
      if (clientReportedDate && !possibleManipulation && !hasDateDiscrepancy) {
        isModifiedAfterDeadline = clientReportedDate > deadlineDate;
        console.log(`Using client reported date for modification check: ${isModifiedAfterDeadline ? "Modified after deadline" : "Modified before deadline"}`);
      }
      
      // בדיקה משופרת: האם הקובץ נערך לפני הדדליין אך הוגש באיחור
      if (isLateSubmission) {
        if (clientReportedDate && !possibleManipulation && !hasDateDiscrepancy) {
          isModifiedBeforeButSubmittedLate = clientReportedDate <= deadlineDate;
          console.log(`File submitted late but modified before deadline: ${isModifiedBeforeButSubmittedLate}`);
        }
      }
    }
    
    // לוג סופי של המסקנות
    console.log("Metadata analysis conclusions:", {
      isLateSubmission,
      isModifiedAfterDeadline,
      isModifiedBeforeButSubmittedLate,
      possibleManipulation,
      hasDateDiscrepancy
    });
    
    // שיפור הדיוק של התוצאות שנשלחות
    res.status(200).json({
      fileName: name,
      fileSize: size,
      fileType: type,
      clientReportedDate: clientReportedDate ? clientReportedDate.toISOString() : null,
      lastModified: serverVerifiedModified ? serverVerifiedModified.toISOString() : null,
      lastModifiedUTC: serverVerifiedModified ? serverVerifiedModified.toISOString() : null,
      serverTime: serverTime.toISOString(),
      timeDifference,
      possibleManipulation,
      hasDateDiscrepancy,
      clientServerDiscrepancy,
      isLateSubmission,
      isModifiedAfterDeadline,
      isModifiedBeforeButSubmittedLate,
      deadline: deadlineDate ? deadlineDate.toISOString() : null
    });
  } catch (error) {
    console.error("Error analyzing metadata:", error);
    res.status(500).json({ message: "Failed to analyze metadata", error: error.toString() });
  }
});

// נקודת קצה לבדיקת openssl
app.get("/api/check-openssl", (req, res) => {
  exec('openssl version', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing openssl: ${error.message}`);
      return res.status(500).json({ 
        message: "openssl command failed to execute", 
        error: error.message,
        stderr: stderr 
      });
    }
    if (stderr) {
      console.warn(`openssl command produced stderr: ${stderr}`);
      // אם יש stderr אבל אין שגיאה ראשית, ייתכן שהפקודה הצליחה אך יש אזהרות
      // נחזיר את stdout אם קיים, אחרת את stderr
      if (stdout) {
        return res.status(200).json({ 
          message: "openssl command executed (with stderr)", 
          version: stdout.trim(),
          stderr: stderr.trim()
        });
      } else {
        return res.status(200).json({ 
          message: "openssl command executed (only stderr output)", 
          stderr: stderr.trim()
        });
      }
    }
    res.status(200).json({ 
      message: "openssl command executed successfully", 
      version: stdout.trim() 
    });
  });
});

// לכל בקשה אחרת (שאינה API ולא קובץ סטטי), החזר את index.html של ה-frontend
// זה מאפשר ל-React Router לטפל בניווט בצד הלקוח
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// האזנה לשרת
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// טיפול בשגיאות לא מטופלות
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // לא מפילים את השרת, רק מתעדים את השגיאה
});