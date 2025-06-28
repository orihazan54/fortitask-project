const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { cloudinary, upload } = require("../config/cloudinary");
const Course = require("../models/Course");
const User = require("../models/User");
const mongoose = require("mongoose");
const fs = require('fs').promises;
const { execFile } = require('child_process');
const util = require('util');
const execFilePromise = util.promisify(execFile);

// Trusted Timestamping Authority (TSA) integration for academic integrity
// --- Import for TSA --- 
const { getVerifiedTimestamp } = require('../tsaHelper');
const axios = require('axios');
const os = require('os');
const path = require('path');
// --- End Import for TSA ---

// Cross-platform file metadata extraction with OS-specific optimizations
// פונקציה לקבלת מטא-דאטא מורחב של הקובץ
async function getExtendedFileMetadata(filePath) {
    try {
        const stats = await fs.stat(filePath);
        let metadata = {
            birthtime: stats.birthtime,
            mtime: stats.mtime,
            ctime: stats.ctime,
            atime: stats.atime
        };

        // Platform-specific metadata extraction for comprehensive file analysis
        // בדיקת מטא-דאטא נוספת בהתאם למערכת ההפעלה
        if (process.platform === 'win32') {
            try {
                // Windows-specific PowerShell metadata extraction
                // שימוש ב-PowerShell לקבלת מידע נוסף בחלונות
                const { stdout } = await execFilePromise('powershell.exe', [
                    '-Command',
                    `(Get-Item '${filePath}').LastWriteTimeUtc.ToString('o')`
                ]);
                metadata.windowsLastWriteTime = new Date(stdout.trim());
            } catch (err) {
                console.error('Error getting Windows metadata:', err);
            }
        } else {
            try {
                // Unix/Linux metadata extraction using stat command
                // שימוש ב-stat בלינוקס/מאק לקבלת מידע נוסף
                const { stdout } = await execFilePromise('stat', ['-f', '%Sm', filePath]);
                metadata.unixLastModified = new Date(stdout.trim());
            } catch (err) {
                console.error('Error getting Unix metadata:', err);
            }
        }

        return metadata;
    } catch (err) {
        console.error('Error getting file metadata:', err);
        return null;
    }
}

// -------------------- 📚 Routes -------------------- //

// Course creation endpoint with file upload support for instructors
// 📌 יצירת קורס חדש (למורים בלבד)
router.post("/create", authenticateToken, upload.single("file"), async (req, res) => {
  // Role-based access control: only teachers can create courses
  if (req.user.role !== "Teacher") {
    return res.status(403).json({ message: "Access denied. Only teachers can create courses." });
  }

  const { courseName, creditPoints, instructions, deadline } = req.body;

  // Input validation for required course parameters
  if (!courseName || !creditPoints || !instructions || !deadline) {
    return res.status(400).json({ message: "All course details are required." });
  }

  try {
    // Course object creation with instructor association
    const newCourse = new Course({
      name: courseName,
      creditPoints: parseFloat(creditPoints),
      instructions,
      deadline: new Date(deadline),
      teacherId: req.user.id,
    });

    // Optional file attachment handling for course materials
    // אם יש קובץ מצורף, הוסף אותו למערך המטלות
    if (req.file) {
      console.log("📄 File uploaded with course creation:", req.file);
      
      newCourse.assignments.push({
        fileUrl: req.file.path,
        fileName: req.file.originalname,
        lastModified: req.file.lastModified ? new Date(req.file.lastModified) : new Date(),
        originalSize: req.file.size,
        fileType: req.file.mimetype,
        uploadedAt: new Date(),
        isMaterial: true // סימון כחומר לימודי
      });
    }

    await newCourse.save();
    return res.status(201).json({ message: "Course created successfully!", course: newCourse });
  } catch (error) {
    console.error("❌ Error creating course:", error);
    return res.status(500).json({ message: "Failed to create course.", error });
  }
});

// Secure file download endpoint with access control and direct Cloudinary integration
// Direct file download endpoint
router.get("/:id/assignments/:assignmentId/download", authenticateToken, async (req, res) => {
  try {
    const { id, assignmentId } = req.params;
    
    // Course and assignment validation
    // Find the course and assignment
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    const assignment = course.assignments.id(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    
    // Fine-grained access control for file downloads
    // Check permissions
    if (!assignment.isMaterial) {
      // Only allow teachers and the student who uploaded the file to access
      if (req.user.role !== "Teacher" && 
         (!assignment.studentId || assignment.studentId.toString() !== req.user.id)) {
        return res.status(403).json({ message: "Access denied for this file" });
      }
    }
    
    if (!assignment.fileUrl) {
      return res.status(404).json({ message: "No file URL found for this assignment" });
    }
    
    // Direct Cloudinary URL provision for efficient file delivery
    // Return the direct Cloudinary URL
    return res.status(200).json({ 
      fileUrl: assignment.fileUrl,
      fileName: assignment.displayName || assignment.fileName || "downloaded-file"
    });
  } catch (error) {
    console.error("Error generating download URL:", error);
    return res.status(500).json({ message: "Failed to generate download URL", error: error.message });
  }
});

// Advanced assignment upload with TSA integration for academic integrity verification
// 📂 העלאת מטלה לענן והכנסה לקורס
router.post("/:id/upload-assignment", authenticateToken, upload.single("file"), async (req, res) => {
  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.log("UPLOAD ASSIGNMENT ROUTE HIT! Course ID:", req.params.id);
  console.log("User:", req.user ? { id: req.user.id, role: req.user.role } : "No user");
  console.log("File received by multer:", req.file ? { originalname: req.file.originalname, path: req.file.path, size: req.file.size } : "No file object");
  console.log("Request body:", req.body);
  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

  let localFilePath = null; // Initialize localFilePath to null
  try {
    // File validation and Cloudinary integration verification
    if (!req.file || !req.file.path) { // req.file.path is the Cloudinary URL
      console.error("❌ No file received or file path missing!");
      return res.status(400).json({ message: "No file uploaded or file path missing!" });
    }
    console.log("File info from multer/cloudinary:", { path: req.file.path, originalname: req.file.originalname });

    // Course and user validation
    const course = await Course.findById(req.params.id);
    if (!course) {
      console.error("❌ Course not found!");
      return res.status(404).json({ message: "Course not found!" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      console.error("❌ User not found!");
      return res.status(404).json({ message: "User not found!" });
    }

    // Deadline validation and late submission detection
    const serverNowAtUploadUTC = new Date(); 
    const deadlineUTC = new Date(course.deadline);
    const isLateUpload = serverNowAtUploadUTC > deadlineUTC; // Renamed from isLate to avoid conflict
    
    // Advanced TSA (Trusted Timestamping Authority) integration for file integrity
    // --- TSA Integration --- 
    const cloudinaryUrl = req.file.path;
    const originalFileNameForTsa = req.file.originalname;
    const tempDir = os.tmpdir();
    localFilePath = path.join(tempDir, `upload_${Date.now()}_${originalFileNameForTsa.replace(/[^a-zA-Z0-9.]/g, '_')}`); // Sanitize filename for path

    console.log(`Attempting to download from Cloudinary: ${cloudinaryUrl} to ${localFilePath}`);
    
    // Environment-specific TSA processing with test mode support
    // Handle both test environment (Buffer) and real environment (Stream)
    let verifiedTimestamp;
    let tsaVerified = false;
    
    if (process.env.NODE_ENV === 'test') {
      // Test environment optimization: skip external TSA dependencies
      // In test environment, skip TSA processing since we're using mock data
      console.log('Test environment detected, skipping TSA processing');
      verifiedTimestamp = null;
    } else {
      // Production TSA verification with file download and timestamp validation
      // Real environment - download and process file
      try {
        const response = await axios.get(cloudinaryUrl, {
          responseType: 'stream'
        });

        const writer = require('fs').createWriteStream(localFilePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', (err) => {
            console.error("Stream writer error during download:", err);
            reject(new Error(`Failed to write downloaded file: ${err.message}`));
          });
        });
        console.log(`File downloaded successfully to ${localFilePath} for TSA processing.`);

        verifiedTimestamp = await getVerifiedTimestamp(localFilePath);
      } catch (downloadError) {
        console.error("Error downloading file for TSA:", downloadError);
        verifiedTimestamp = null;
      }
    }

    // Timestamp determination with TSA priority fallback system
    let actualLastModified;

    if (verifiedTimestamp) {
        console.log(`Using verified TSA timestamp: ${verifiedTimestamp.toISOString()}`);
        actualLastModified = verifiedTimestamp;
        tsaVerified = true;
    } else {
        console.warn(`Could not get verified TSA timestamp for ${originalFileNameForTsa}. Falling back to client reported date or server time.`);
        if (req.body.lastModified) {
            actualLastModified = new Date(parseInt(req.body.lastModified));
        } else {
            actualLastModified = serverNowAtUploadUTC; // Fallback to server time if no client time
        }
    }
    // --- End TSA Integration ---

    // Client-reported timestamp extraction for comparison analysis
    let clientReportedDate = null;
    if (req.body.lastModified) {
        clientReportedDate = new Date(parseInt(req.body.lastModified));
    }

    // Advanced timestamp manipulation detection algorithm
    // -------- מנגנון זיהוי מניפולציה מחודש -------- //
    let suspectedTimeManipulation = false;
    let clientTsaDiffMinutes = null; // פער בין זמן הלקוח לחותמת TSA

    // TSA-based manipulation detection with tolerance thresholds
    if (tsaVerified && clientReportedDate) {
        // Compare client-reported time against verified TSA timestamp
        // אם יש חותמת אמינה וגם זמן מדווח ע"י הדפדפן – משווים ביניהם
        clientTsaDiffMinutes = Math.abs((actualLastModified.getTime() - clientReportedDate.getTime()) / (60 * 1000));
        const MAX_DELTA_MIN = 2; // טולרנס של 2 דקות
        if (clientTsaDiffMinutes > MAX_DELTA_MIN) {
            suspectedTimeManipulation = true;
        }
    } else if (clientReportedDate) {
        // Fallback manipulation detection using server time comparison
        // fallback: אין TSA מאומת – בודקים מול זמן השרת כפי שהיה קודם
        const diffToServerMin = Math.abs((serverNowAtUploadUTC.getTime() - clientReportedDate.getTime()) / (60 * 1000));
        const MAX_ALLOWED_SERVER_DIFF_MIN = 24 * 60; // 24 שעות
        if (clientReportedDate > serverNowAtUploadUTC || diffToServerMin > MAX_ALLOWED_SERVER_DIFF_MIN) {
            suspectedTimeManipulation = true;
        }
    }
    
    // Academic integrity checks: deadline compliance analysis
    // Use actualLastModified (preferring TSA) for deadline checks
    const isModifiedAfterDeadline = actualLastModified > deadlineUTC;
    const isModifiedBeforeButSubmittedLate = isLateUpload && actualLastModified && actualLastModified <= deadlineUTC && !suspectedTimeManipulation;

    // User notification system based on submission status
    let notificationMessage;
    if (isLateUpload) {
        notificationMessage = `Your assignment was submitted late.`;
    } else {
        notificationMessage = `Your assignment was submitted successfully.`;
    }

    // Comprehensive assignment metadata object with security and integrity data
    const newAssignment = {
      fileUrl: req.file.path, 
      fileName: req.file.originalname,
      displayName: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
      uploadedAt: serverNowAtUploadUTC,
      clientReportedDate: clientReportedDate ? clientReportedDate.toISOString() : null,
      lastModified: actualLastModified, // Use the determined actualLastModified
      lastModifiedUTC: actualLastModified ? actualLastModified.toISOString() : null,
      tsaVerifiedTimestamp: tsaVerified ? actualLastModified.toISOString() : null,
      tsaVerificationFailed: !tsaVerified && !!verifiedTimestamp, // True if TSA process ran but failed
      serverReceivedTime: serverNowAtUploadUTC, 
      originalSize: req.file.size,
      fileType: req.file.mimetype,
      isLateSubmission: isLateUpload, // Use the renamed variable
      isModifiedAfterDeadline: isModifiedAfterDeadline, // Now based on actualLastModified
      isModifiedBeforeButSubmittedLate: isModifiedBeforeButSubmittedLate, // Now based on actualLastModified
      suspectedTimeManipulation: suspectedTimeManipulation,
      clientTsaDiffMinutes: clientTsaDiffMinutes,
      // Additional timing metadata for audit trail
      // שמור גם את פער לקוח-שרת לצרכי מידע (לא קובע חשד אם קיימת חותמת TSA)
      timeDifferenceMinutes: clientReportedDate ? Math.abs((serverNowAtUploadUTC.getTime() - clientReportedDate.getTime()) / (60 * 1000)) : null,
      submissionComment: req.body.comment || "",
      studentId: req.user.role === "Student" ? req.user.id : undefined,
      studentName: req.user.role === "Student" ? user.username : undefined,
      studentEmail: req.user.role === "Student" ? user.email : undefined,
      isLocked: isLateUpload && req.user.role === "Student",
      isMaterial: req.user.role === "Teacher" ? true : false,
    };
    
    // Audit logging for assignment submission with integrity verification results
    console.log("Final assignment data for DB (with TSA info):", {
        clientReportedDate: newAssignment.clientReportedDate,
        lastModifiedUTC: newAssignment.lastModifiedUTC,
        tsaVerifiedTimestamp: newAssignment.tsaVerifiedTimestamp,
        isLateSubmission: newAssignment.isLateSubmission,
        isModifiedAfterDeadline: newAssignment.isModifiedAfterDeadline,
        isModifiedBeforeButSubmittedLate: newAssignment.isModifiedBeforeButSubmittedLate,
        suspectedTimeManipulation: newAssignment.suspectedTimeManipulation
    });

    // Database persistence of assignment with metadata
    course.assignments.push(newAssignment);
    await course.save();

    // Student notification system integration
    if (req.user.role === "Student") {
      try {
        await user.addNotification(notificationMessage);
      } catch (err) {
        console.error("Failed to add notification:", err);
      }
    }

    // Comprehensive response with integrity verification results
    // Ensure we return the response
    console.log("✅ About to send successful response with status 201");
    return res.status(201).json({ 
      message: "Assignment uploaded successfully!", 
      assignment: newAssignment,
      // Academic integrity flags for frontend display
      // Return relevant flags to the client
      isLate: newAssignment.isLateSubmission,
      isModifiedAfterDeadline: newAssignment.isModifiedAfterDeadline,
      isModifiedBeforeButSubmittedLate: newAssignment.isModifiedBeforeButSubmittedLate,
      suspectedTimeManipulation: newAssignment.suspectedTimeManipulation,
      tsaVerified: tsaVerified
    });

  } catch (error) {
    console.error("❌ Server Error while uploading assignment:", error);
    return res.status(500).json({ message: "Failed to upload assignment.", error: error.message || error });
  } finally {
    // Cleanup: remove temporary files after TSA processing
    if (localFilePath && process.env.NODE_ENV !== 'test') {
        try {
            await fs.unlink(localFilePath);
            console.log(`Temporary file ${localFilePath} deleted successfully after TSA processing.`);
        } catch (cleanupError) {
            console.error(`Error deleting temporary file ${localFilePath}:`, cleanupError);
        }
    }
  }
});

// Course update endpoint with file attachment support
// 📌 עדכון קורס קיים
router.put("/:id", authenticateToken, upload.single("file"), async (req, res) => {
  // Authorization check: only teachers can modify courses
  if (req.user.role !== "Teacher") {
    return res.status(403).json({ message: "Access denied. Only teachers can update courses." });
  }

  const { name, creditPoints, instructions, deadline } = req.body;
  
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }
    
    // Ownership verification: teachers can only update their own courses
    if (course.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only update courses you created." });
    }

    // Selective course parameter updates
    // עדכון פרטי הקורס
    if (name) course.name = name;
    if (creditPoints) course.creditPoints = parseFloat(creditPoints);
    if (instructions) course.instructions = instructions;
    if (deadline) course.deadline = new Date(deadline);

    // Optional file attachment processing for course materials
    // אם יש קובץ מצורף, הוסף אותו למערך המטלות
    if (req.file) {
      console.log("📄 File uploaded with course update:", req.file);
      
      newCourse.assignments.push({
        fileUrl: req.file.path,
        fileName: req.file.originalname,
        lastModified: req.file.lastModified ? new Date(req.file.lastModified) : new Date(),
        originalSize: req.file.size,
        fileType: req.file.mimetype,
        uploadedAt: new Date(),
        isMaterial: true // סימון כחומר לימודי
      });
    }

    await course.save();
    
    return res.status(200).json({ message: "Course updated successfully!", course });
  } catch (error) {
    console.error("❌ Error updating course:", error);
    return res.status(500).json({ message: "Failed to update course.", error });
  }
});

// Course listing endpoint with role-based filtering
// 📚 שליפת כל הקורסים
router.get("/", authenticateToken, async (req, res) => {
  try {
    let courses;
    if (req.user.role === "Student") {
      courses = await Course.find({}).populate("students", "username email");
    } else if (req.user.role === "Teacher") {
      courses = await Course.find({ teacherId: req.user.id }).populate("students", "username email");
    } else {
      return res.status(403).json({ message: "Access denied. Invalid role." });
    }

    // עבור הקורסים, אנחנו נרצה לדעת אם ישנן מטלות והאם הם הוגשו באיחור
    const coursesWithTeacherInfo = await Promise.all(courses.map(async (course) => {
      const teacher = await User.findById(course.teacherId, "username");
      return {
        ...course.toObject(),
        teacherName: teacher ? teacher.username : "Unknown"
      };
    }));

    return res.status(200).json(coursesWithTeacherInfo);
  } catch (error) {
    console.error("❌ Error fetching courses:", error);
    return res.status(500).json({ message: "Failed to fetch courses." });
  }
});

// 📌 שליפת קורס לפי מזהה
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    // Check if this is a special route or an actual course ID
    if (req.params.id === "my-courses" || req.params.id === "enrolled") {
      return res.status(400).json({ message: "Invalid course ID. Use the specific endpoint for enrolled courses." });
    }
    
    const course = await Course.findById(req.params.id).populate("students", "username email");
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // הוספת פרטי המורה
    const teacher = await User.findById(course.teacherId, "username email");
    const courseWithTeacher = {
      ...course.toObject(),
      teacherName: teacher ? teacher.username : "Unknown"
    };

    return res.status(200).json(courseWithTeacher);
  } catch (error) {
    console.error("❌ Error fetching course details:", error);
    return res.status(500).json({ message: "Failed to fetch course details." });
  }
});

// 🔹 הרשמה לקורס (לסטודנטים בלבד)
router.post("/register/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "Student") {
    return res.status(403).json({ message: "Access denied. Only students can register for courses." });
  }

  try {
    const courseId = req.params.id;
    console.log(`User ${req.user.id} is trying to register to course ${courseId}`);
    
    // Validate course ID
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID format." });
    }
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Check if user is already registered
    const isAlreadyRegistered = course.students.some(
      studentId => studentId.toString() === req.user.id
    );
    
    if (isAlreadyRegistered) {
      return res.status(400).json({ message: "You are already registered for this course." });
    }

    // Add student to course
    course.students.push(req.user.id);
    await course.save();
    
    // Also update user's courses array
    await User.findByIdAndUpdate(
      req.user.id, 
      { $addToSet: { courses: courseId } }
    );
    
    console.log(`User ${req.user.id} successfully registered to course ${courseId}`);
    
    return res.status(200).json({ 
      message: "Successfully registered to the course.", 
      course: {
        _id: course._id,
        name: course.name,
        creditPoints: course.creditPoints,
        deadline: course.deadline
      }
    });
  } catch (error) {
    console.error("❌ Error registering to course:", error);
    return res.status(500).json({ message: "Failed to register to course.", error: error.message });
  }
});

// 🔹 שליפת הקורסים שהסטודנט רשום אליהם - CHANGED to /enrolled
router.get("/enrolled", authenticateToken, async (req, res) => {
  try {
    console.log(`Fetching enrolled courses for user ${req.user.id} with role ${req.user.role}`);
    
    let courses;
    
    if (req.user.role === "Student") {
      // Get courses where the student is in the students array
      courses = await Course.find({ 
        students: { $in: [req.user.id] } 
      });
      
      console.log(`Found ${courses.length} courses for student ${req.user.id}`);
    } else if (req.user.role === "Teacher") {
      courses = await Course.find({ 
        teacherId: req.user.id 
      }).populate("students", "username email");
      
      console.log(`Found ${courses.length} courses taught by teacher ${req.user.id}`);
    } else {
      return res.status(403).json({ message: "Access denied. Invalid role." });
    }

    // מידע נוסף על המורה והמטלות
    const coursesWithDetails = await Promise.all(courses.map(async (course) => {
      let studentAssignments = [];
      
      if (req.user.role === "Student") {
        // עבור סטודנט, חלץ רק את המטלות שלו
        studentAssignments = course.assignments.filter(
          assignment => assignment.studentId && assignment.studentId.toString() === req.user.id
        );
      }
      
      const teacher = await User.findById(course.teacherId, "username");
      return {
        ...course.toObject(),
        teacherName: teacher ? teacher.username : "Unknown",
        studentAssignments: req.user.role === "Student" ? studentAssignments : []
      };
    }));

    console.log(`Returning ${coursesWithDetails.length} courses with details`);
    return res.status(200).json(coursesWithDetails);
  } catch (error) {
    console.error("❌ Error fetching enrolled courses:", error);
    return res.status(500).json({ message: "Failed to fetch courses.", error: error.message });
  }
});

// Support for legacy route - redirect to the new route
router.get("/my-courses", authenticateToken, async (req, res) => {
  try {
    console.log(`Using legacy endpoint my-courses for user ${req.user.id}`);
    let courses;
    
    if (req.user.role === "Student") {
      // Get courses where student ID is in the students array
      courses = await Course.find({ 
        students: { $in: [req.user.id] } 
      });
    } else if (req.user.role === "Teacher") {
      courses = await Course.find({ 
        teacherId: req.user.id 
      }).populate("students", "username email");
    } else {
      return res.status(403).json({ message: "Access denied. Invalid role." });
    }

    console.log(`Found ${courses.length} courses in /my-courses endpoint`);
    
    // מידע נוסף על המורה והמטלות
    const coursesWithDetails = await Promise.all(courses.map(async (course) => {
      let studentAssignments = [];
      
      if (req.user.role === "Student") {
        // עבור סטודנט, חלץ רק את המטלות שלו
        studentAssignments = course.assignments.filter(
          assignment => assignment.studentId && assignment.studentId.toString() === req.user.id
        );
      }
      
      const teacher = await User.findById(course.teacherId, "username");
      return {
        ...course.toObject(),
        teacherName: teacher ? teacher.username : "Unknown",
        studentAssignments: req.user.role === "Student" ? studentAssignments : []
      };
    }));

    return res.status(200).json(coursesWithDetails);
  } catch (error) {
    console.error("❌ Error fetching my courses:", error);
    return res.status(500).json({ message: "Failed to fetch courses.", error: error.message });
  }
});

// 📂 קבלת מטלות של קורס
router.get("/:id/assignments", authenticateToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // עבור מרצה - החזר את כל המטלות עם פרטים מורחבים
    if (req.user.role === "Teacher") {
      // מיון המטלות לפי סוג (חומרי לימוד ומטלות סטודנטים) ותאריך
      const materials = course.assignments
        .filter(assignment => assignment.isMaterial)
        .sort((a, b) => b.uploadedAt - a.uploadedAt);
      
      const studentSubmissions = course.assignments
        .filter(assignment => !assignment.isMaterial)
        .sort((a, b) => b.uploadedAt - a.uploadedAt);
      
      return res.status(200).json({
        materials,
        studentSubmissions
      });
    }
    
    // עבור סטודנט - החזר את המטלות שלו וחומרי הלימוד של המרצה
    const studentAssignments = course.assignments.filter(
      assignment => 
        assignment.isMaterial || // חומרי לימוד
        (assignment.studentId && assignment.studentId.toString() === req.user.id) // או מטלות של הסטודנט עצמו
    );
    
    return res.status(200).json(studentAssignments);
  } catch (error) {
    console.error("❌ Error fetching assignments:", error);
    return res.status(500).json({ message: "Failed to fetch assignments." });
  }
});

// 📌 מחיקת מטלה מהקורס
router.delete("/:id/assignments/:assignmentId", authenticateToken, async (req, res) => {
  try {
    const { id, assignmentId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID format." });
    }
    
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ message: "Invalid assignment ID format." });
    }

    const course = await Course.findById(id);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }
    
    const assignment = course.assignments.id(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    if (req.user.role === "Student") {
      if (assignment.studentId && assignment.studentId.toString() !== req.user.id) {
        return res.status(403).json({ message: "You can only delete your own assignments." });
      }
      
      if (assignment.isLocked) {
        return res.status(403).json({ message: "You cannot delete assignments that have been locked." });
      }
      
      if (assignment.isLateSubmission) {
        return res.status(403).json({ message: "You cannot delete assignments submitted after the deadline." });
      }
    } 
    else if (req.user.role === "Teacher" && course.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete assignments in courses you teach." });
    }

    // Try to delete the file from Cloudinary if it exists
    if (assignment.fileUrl) {
      try {
        // Extract the public ID from the Cloudinary URL
        const splitUrl = assignment.fileUrl.split('/');
        const filename = splitUrl[splitUrl.length - 1];
        const publicId = `fortitask/${filename.split('.')[0]}`;
        
        console.log("Attempting to delete Cloudinary file with public ID:", publicId);
        
        await cloudinary.uploader.destroy(publicId);
        console.log(`✅ File ${publicId} deleted from Cloudinary`);
      } catch (cloudinaryError) {
        console.error("❌ Error deleting file from Cloudinary:", cloudinaryError);
        // Continue despite error deleting the file
      }
    }

    // מחק את המטלה מהמערך
    course.assignments.pull(assignmentId);
    await course.save();

    return res.status(200).json({ 
      message: "Assignment deleted successfully.", 
      remainingAssignments: course.assignments 
    });
    
  } catch (error) {
    console.error("❌ Error deleting assignment:", error);
    return res.status(500).json({ message: "Failed to delete assignment." });
  }
});

// 🔹 מחיקת קורס (למורים בלבד)
router.delete("/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "Teacher") {
    return res.status(403).json({ message: "Access denied. Only teachers can delete courses." });
  }

  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    if (course.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete courses you created." });
    }

    // Delete all files from Cloudinary
    for (const assignment of course.assignments) {
      if (assignment.fileUrl) {
        try {
          // Extract the public ID from the Cloudinary URL
          const splitUrl = assignment.fileUrl.split('/');
          const filename = splitUrl[splitUrl.length - 1];
          const publicId = `fortitask/${filename.split('.')[0]}`;
          
          console.log("Attempting to delete Cloudinary file with public ID:", publicId);
          
          await cloudinary.uploader.destroy(publicId);
          console.log(`✅ File ${publicId} deleted from Cloudinary`);
        } catch (cloudinaryError) {
          console.error("❌ Error deleting file from Cloudinary:", cloudinaryError);
          // Continue despite error deleting the file
        }
      }
    }

    await course.deleteOne();
    return res.status(200).json({ message: "Course deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting course:", error);
    return res.status(500).json({ message: "Failed to delete course." });
  }
});

module.exports = router;