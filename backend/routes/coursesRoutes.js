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

        // בדיקת מטא-דאטא נוספת בהתאם למערכת ההפעלה
        if (process.platform === 'win32') {
            try {
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

// 📌 יצירת קורס חדש (למורים בלבד)
router.post("/create", authenticateToken, upload.single("file"), async (req, res) => {
  if (req.user.role !== "Teacher") {
    return res.status(403).json({ message: "Access denied. Only teachers can create courses." });
  }

  const { courseName, creditPoints, instructions, deadline } = req.body;

  if (!courseName || !creditPoints || !instructions || !deadline) {
    return res.status(400).json({ message: "All course details are required." });
  }

  try {
    const newCourse = new Course({
      name: courseName,
      creditPoints: parseFloat(creditPoints),
      instructions,
      deadline: new Date(deadline),
      teacherId: req.user.id,
    });

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

// Direct file download endpoint
router.get("/:id/assignments/:assignmentId/download", authenticateToken, async (req, res) => {
  try {
    const { id, assignmentId } = req.params;
    
    // Find the course and assignment
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    const assignment = course.assignments.id(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    
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

// 📂 העלאת מטלה לענן והכנסה לקורס
router.post("/:id/upload-assignment", authenticateToken, upload.single("file"), async (req, res) => {
  let localFilePath = req.file?.path; // Store the initial path in case we need it for cleanup
  try {
    if (!req.file) {
      console.error("❌ No file received!");
      return res.status(400).json({ message: "No file uploaded!" });
    }
    // Path from multer-storage-cloudinary is the URL, not local path for fs.stat
    console.log("File info from multer/cloudinary:", { path: req.file.path, originalname: req.file.originalname });

    const course = await Course.findById(req.params.id);
    if (!course) {
      console.error("❌ Course not found!");
      // Note: Cannot easily delete from Cloudinary here without more info/SDK call
      return res.status(404).json({ message: "Course not found!" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      console.error("❌ User not found!");
      return res.status(404).json({ message: "User not found!" });
    }

    const serverNowAtUploadUTC = new Date(); 
    const deadlineUTC = new Date(course.deadline);
    const isLate = serverNowAtUploadUTC > deadlineUTC;
    
    let clientReportedDate = null;
    let suspectedTimeManipulation = false;
    let isModifiedAfterDeadline = false; 
    let timeDifferenceMinutes = null;

    if (req.body.lastModified) {
        clientReportedDate = new Date(parseInt(req.body.lastModified));
        timeDifferenceMinutes = Math.abs((serverNowAtUploadUTC.getTime() - clientReportedDate.getTime()) / (60 * 1000));
        const MAX_ALLOWED_TIME_DIFFERENCE_MIN = 24 * 60; // 24 שעות

        // חשד למניפולציה: זמן עריכה בעתיד או הפרש קיצוני
        if (clientReportedDate.getTime() > serverNowAtUploadUTC.getTime() || timeDifferenceMinutes > MAX_ALLOWED_TIME_DIFFERENCE_MIN) {
            suspectedTimeManipulation = true;
        }
        // האם הקובץ נערך אחרי הדדליין
        isModifiedAfterDeadline = clientReportedDate > deadlineUTC;
    } else {
        isModifiedAfterDeadline = false;
        if (isLate) {
            suspectedTimeManipulation = true;
        }
    }

    // האם הקובץ נערך לפני הדדליין אך הוגש באיחור (רק אם אין חשד למניפולציה)
    const isModifiedBeforeButSubmittedLate = isLate && clientReportedDate && !isModifiedAfterDeadline && !suspectedTimeManipulation;

    // הודעה לסטודנט בלבד (פשוטה)
    let notificationMessage;
    if (isLate) {
        notificationMessage = `Your assignment was submitted late.`;
    } else {
        notificationMessage = `Your assignment was submitted successfully.`;
    }

    const newAssignment = {
      fileUrl: req.file.path, // This is the Cloudinary URL
      fileName: req.file.originalname,
      displayName: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
      uploadedAt: serverNowAtUploadUTC,
      clientReportedDate: clientReportedDate ? clientReportedDate.toISOString() : null,
      // Remove serverFsMtime and related fields
      lastModified: clientReportedDate, // Store client reported date as the primary lastModified 
      lastModifiedUTC: clientReportedDate ? clientReportedDate.toISOString() : null,
      serverReceivedTime: serverNowAtUploadUTC, 
      originalSize: req.file.size,
      fileType: req.file.mimetype,
      isLateSubmission: isLate,
      isModifiedAfterDeadline: isModifiedAfterDeadline, // Based only on client time
      isModifiedBeforeButSubmittedLate: isModifiedBeforeButSubmittedLate,
      suspectedTimeManipulation: suspectedTimeManipulation,
      timeDifferenceMinutes: timeDifferenceMinutes,
      submissionComment: req.body.comment || "",
      studentId: req.user.role === "Student" ? req.user.id : undefined,
      studentName: req.user.role === "Student" ? user.username : undefined,
      studentEmail: req.user.role === "Student" ? user.email : undefined,
      isLocked: isLate && req.user.role === "Student",
      isMaterial: req.user.role === "Teacher" ? true : false,
    };
    
    console.log("Final assignment data for DB (Simplified):", {
        clientReportedDate: newAssignment.clientReportedDate,
        lastModifiedUTC: newAssignment.lastModifiedUTC,
        isLateSubmission: newAssignment.isLateSubmission,
        isModifiedAfterDeadline: newAssignment.isModifiedAfterDeadline,
        isModifiedBeforeButSubmittedLate: newAssignment.isModifiedBeforeButSubmittedLate,
        suspectedTimeManipulation: newAssignment.suspectedTimeManipulation
    });

    course.assignments.push(newAssignment);
    await course.save();

    // Add notification for student
    if (req.user.role === "Student") {
      try {
        await user.addNotification(notificationMessage);
      } catch (err) {
        console.error("Failed to add notification:", err);
      }
    }

    return res.status(201).json({ 
      message: "Assignment uploaded successfully!", 
      assignment: newAssignment,
      isLate: newAssignment.isLateSubmission,
      isModifiedAfterDeadline: newAssignment.isModifiedAfterDeadline,
      isModifiedBeforeButSubmittedLate: newAssignment.isModifiedBeforeButSubmittedLate,
      suspectedTimeManipulation: newAssignment.suspectedTimeManipulation,
      timeDifferenceMinutes: newAssignment.timeDifferenceMinutes,
    });

  } catch (error) {
    console.error("❌ Server Error while uploading assignment:", error);
    // Removed local file cleanup as we might not have one with Cloudinary direct upload
    return res.status(500).json({ message: "Failed to upload assignment.", error: error.message || error });
  }
});

// 📌 עדכון קורס קיים
router.put("/:id", authenticateToken, upload.single("file"), async (req, res) => {
  if (req.user.role !== "Teacher") {
    return res.status(403).json({ message: "Access denied. Only teachers can update courses." });
  }

  const { name, creditPoints, instructions, deadline } = req.body;
  
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }
    
    if (course.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only update courses you created." });
    }

    // עדכון פרטי הקורס
    if (name) course.name = name;
    if (creditPoints) course.creditPoints = parseFloat(creditPoints);
    if (instructions) course.instructions = instructions;
    if (deadline) course.deadline = new Date(deadline);

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