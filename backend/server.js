// Load environment variables first for security
require("dotenv").config();
const { cloudinary } = require("./config/cloudinary");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const { exec } = require('child_process');

// Import application routes
const userRoutes = require("./routes/userRoutes");
const coursesRoutes = require("./routes/coursesRoutes");

const app = express();

// CORS configuration for multiple deployment environments
const allowedOrigins = [
  "http://localhost:3000",
  "https://www.fortitask.org",
  "https://fortitask.org",
  "https://fortitask-frontend.onrender.com",
  "https://fortitask-project.onrender.com"
];

// Enable credentials for secure cookie transmission
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// Dynamic CORS middleware with origin validation
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  credentials: true
}));

// Parse JSON requests with increased size limit for file metadata
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically for direct access
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Cloudinary configuration verification for debugging
console.log("✅ Cloudinary Config:");
console.log("CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API_KEY:", process.env.CLOUDINARY_API_KEY ? "Loaded" : "Missing");
console.log("API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "Loaded" : "Missing");

// Database connection with environment-specific handling
if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ Error connecting to MongoDB:", err));
}

// API Routes registration
app.use("/api/users", userRoutes);
app.use("/api/courses", coursesRoutes);

// Serve React frontend in production
const frontendBuildPath = path.join(__dirname, '../build');
app.use(express.static(frontendBuildPath));

// Health check endpoint for monitoring
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Advanced file metadata analysis endpoint for academic integrity
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
    
    // Extract client-reported metadata
    const { lastModified, name, size, type } = fileData;
    
    // Store client reported modification date for comparison
    const clientReportedDate = lastModified ? new Date(lastModified) : null;
    
    // Server timestamp for integrity verification
    const serverTime = new Date();
    
    // Detect potential timestamp manipulation
    // Calculate time difference only if client reported a date
    let timeDifference = 0;
    let possibleManipulation = false;
    
    if (clientReportedDate) {
      timeDifference = Math.abs(serverTime - clientReportedDate);
      // Threshold for suspicious modification: more than 2 hours difference
      possibleManipulation = timeDifference > 7200000; // 2 hours in milliseconds
      console.log(`Time difference: ${timeDifference / 1000 / 60} minutes, Possible manipulation: ${possibleManipulation}`);
    } else {
      console.log("No client reported date available");
    }
    
    // Use client-reported date as baseline unless manipulation is suspected
    const serverVerifiedModified = clientReportedDate || new Date();
    
    // Measure discrepancy between client and server timestamps
    const clientServerDiscrepancy = clientReportedDate ? Math.abs(clientReportedDate - serverTime) : 0;
    const hasDateDiscrepancy = clientServerDiscrepancy > 60000 && clientServerDiscrepancy > 7200000;
    
    // Academic deadline violation detection
    // Get deadline for comparison (if provided)
    let deadlineDate = null;
    let isLateSubmission = false;
    let isModifiedAfterDeadline = false;
    let isModifiedBeforeButSubmittedLate = false;
    
    if (deadline) {
      deadlineDate = new Date(deadline);
      console.log(`Deadline: ${deadlineDate.toISOString()}`);
      
      // Check if submission is late based on server time
      isLateSubmission = serverTime > deadlineDate;
      
      // Check if file was modified after deadline using verified timestamp
      if (clientReportedDate && !possibleManipulation && !hasDateDiscrepancy) {
        isModifiedAfterDeadline = clientReportedDate > deadlineDate;
        console.log(`Using client reported date for modification check: ${isModifiedAfterDeadline ? "Modified after deadline" : "Modified before deadline"}`);
      }
      
      // Detect scenario: file modified before deadline but submitted late
      if (isLateSubmission) {
        if (clientReportedDate && !possibleManipulation && !hasDateDiscrepancy) {
          isModifiedBeforeButSubmittedLate = clientReportedDate <= deadlineDate;
          console.log(`File submitted late but modified before deadline: ${isModifiedBeforeButSubmittedLate}`);
        }
      }
    }
    
    // Log analysis conclusions for audit trail
    console.log("Metadata analysis conclusions:", {
      isLateSubmission,
      isModifiedAfterDeadline,
      isModifiedBeforeButSubmittedLate,
      possibleManipulation,
      hasDateDiscrepancy
    });
    
    // Return comprehensive metadata analysis results
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

// OpenSSL verification endpoint for cryptographic operations
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
      // Handle cases where stderr exists but command succeeded
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

// טיפול בשגיאות לא מטופלות
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // לא מפילים את השרת, רק מתעדים את השגיאה
});

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;