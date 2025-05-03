
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const Course = require("../models/Course");
const User = require("../models/User");
const mongoose = require("mongoose");

// 📌 הגדרת Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("✅ Cloudinary Config:");
console.log("CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API_KEY:", process.env.CLOUDINARY_API_KEY ? "Loaded" : "Missing");
console.log("API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "Loaded" : "Missing");

// 📌 בדיקת חיבור ל-Cloudinary
cloudinary.api.ping()
  .then(res => console.log("✅ Cloudinary Connection Successful!", res))
  .catch(err => console.error("❌ Cloudinary Connection Failed!", err));

// 📌 הגדרת Multer לאחסון הקבצים ב-Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "assignments",
    resource_type: "auto", // מאפשר העלאת כל סוגי הקבצים
    use_filename: true,     // שימוש בשם המקורי של הקובץ
    unique_filename: true,  // הוספת מזהה ייחודי
    encoding: "utf8",       // תמיכה בעברית ושפות אחרות
  },
});
const upload = multer({ storage });

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

// 📂 העלאת מטלה ל-Cloudinary עם בדיקת מטא-דאטה ושמירת פרטי הסטודנט
router.post("/:id/upload-assignment", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    console.log("📥 File upload request received for Course ID:", req.params.id);
    console.log("User ID from auth:", req.user.id);
    
    if (!req.file) {
      console.error("❌ No file received!");
      return res.status(400).json({ message: "No file uploaded!" });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      console.error("❌ Course not found!");
      return res.status(404).json({ message: "Course not found!" });
    }

    // קבלת פרטי המשתמש השלמים
    const user = await User.findById(req.user.id);
    if (!user) {
      console.error("❌ User not found!");
      return res.status(404).json({ message: "User not found!" });
    }

    // ========== זמן שרת אמיתי - אין דרך לזייף ========== //
    const serverNowUTC = new Date();
    const deadlineUTC = new Date(course.deadline);
    const isLate = serverNowUTC > deadlineUTC;
    
    // בדיקת מטא-דאטה של הקובץ - ניתוח מעמיק
    let isModifiedAfterDeadline = false;
    let lastModifiedDate = null;
    let suspectedTimeManipulation = false;
    
    // ננסה לקבל את תאריך lastModified מה-Frontend 
    // אבל עכשיו נוודא שאין מניפולציות
    if (req.body.lastModifiedUTC) {
      try {
        lastModifiedDate = new Date(req.body.lastModifiedUTC);
        console.log("Using lastModifiedUTC from frontend:", req.body.lastModifiedUTC, "->", lastModifiedDate.toISOString());
        
        // בדיקה אם יש הפרש חשוד בין הזמן שהלקוח טוען לבין הזמן האמיתי בשרת
        const timeDifferenceMs = Math.abs(serverNowUTC - lastModifiedDate);
        if (timeDifferenceMs > 3600000) { // הפרש של יותר משעה נחשב חשוד
          console.warn("⚠️ Suspicious time difference detected:", timeDifferenceMs / 1000 / 60, "minutes");
          suspectedTimeManipulation = true;
        }
      } catch (e) {
        console.error("Error parsing lastModifiedUTC:", e);
        // המשך לשיטות אחרות אם השיטה הזו נכשלת
      }
    }
    
    // אם אין UTC ננסה לקבל את תאריך lastModified רגיל
    if (!lastModifiedDate && req.body.lastModified) {
      // אם הגיע מספר כמספר (מילישניות), נמיר ל-Date ב-UTC
      if (!isNaN(req.body.lastModified)) {
        lastModifiedDate = new Date(Number(req.body.lastModified));
        console.log("Using numeric lastModified from frontend:", req.body.lastModified, "->", lastModifiedDate.toISOString());
        
        // בדיקת מניפולציה
        const timeDifferenceMs = Math.abs(serverNowUTC - lastModifiedDate);
        if (timeDifferenceMs > 3600000) {
          console.warn("⚠️ Suspicious time difference detected:", timeDifferenceMs / 1000 / 60, "minutes");
          suspectedTimeManipulation = true;
        }
      } else {
        lastModifiedDate = new Date(req.body.lastModified); // אם נשלח כתאריך string
        console.log("Using string lastModified from frontend:", req.body.lastModified, "->", lastModifiedDate.toISOString());
        
        // בדיקת מניפולציה
        const timeDifferenceMs = Math.abs(serverNowUTC - lastModifiedDate);
        if (timeDifferenceMs > 3600000) {
          console.warn("⚠️ Suspicious time difference detected:", timeDifferenceMs / 1000 / 60, "minutes");
          suspectedTimeManipulation = true;
        }
      }
    }

    // אם לא הגיע lastModified נקבע לזמן העלאה (הנחות זהירות)
    if (!lastModifiedDate) {
      lastModifiedDate = serverNowUTC;
      console.log("No lastModified provided, using server time:", lastModifiedDate.toISOString());
    }

    // נוודא ששתי ההשוואות הן ב-UTC
    // בדיקה מבוססת שרת - לא ניתנת למניפולציה
    if (lastModifiedDate > deadlineUTC) {
      isModifiedAfterDeadline = true;
      console.log("❗ File was modified after deadline! Deadline:", deadlineUTC.toISOString(), "Modified:", lastModifiedDate.toISOString());
      
      // רישום בפרופיל המשתמש שהעלה קובץ שנערך לאחר המועד (לצרכי סטטיסטיקה)
      if (req.user.role === "Student") {
        try {
          await user.recordModifiedAfterDeadline();
          console.log("Recorded modified-after-deadline submission for user:", user._id);
        } catch (err) {
          console.error("Failed to record modified-after-deadline:", err);
        }
      }
    }
    
    // רישום בפרופיל המשתמש שהגיש באיחור (לצרכי סטטיסטיקה)
    if (isLate && req.user.role === "Student") {
      try {
        await user.recordLateSubmission();
        console.log("Recorded late submission for user:", user._id);
      } catch (err) {
        console.error("Failed to record late submission:", err);
      }
    }

    // נקבע את שם הקובץ לתצוגה 
    const originalFileName = req.file.originalname;
    const displayName = Buffer.from(originalFileName, 'latin1').toString('utf8');
    console.log(`📄 Original file name: ${originalFileName}, Display name: ${displayName}`);

    // שמירת הערה להגשה (אם קיימת)
    const submissionComment = req.body.comment || "";

    const newAssignment = {
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      displayName: displayName,
      uploadedAt: serverNowUTC,
      lastModified: lastModifiedDate,
      lastModifiedUTC: lastModifiedDate, // שמירה נוספת ב-UTC לדיוק מרבי
      serverReceivedTime: serverNowUTC,  // זמן קבלת הקובץ בשרת - לא ניתן למניפולציה
      originalSize: req.file.size,
      fileType: req.file.mimetype,
      isLateSubmission: isLate,
      isModifiedAfterDeadline: isModifiedAfterDeadline,
      suspectedTimeManipulation: suspectedTimeManipulation, // דגל חדש למניפולציית זמן
      isMaterial: req.user.role === "Teacher" ? true : false,
      submissionComment: submissionComment,
      // זה החלק החשוב - שמירת מזהה הסטודנט באופן נכון
      studentId: req.user.role === "Student" ? req.user.id : undefined,
      studentName: req.user.role === "Student" ? user.username : undefined,
      studentEmail: req.user.role === "Student" ? user.email : undefined,
      // נעילת המטלה אם הוגשה לאחר הדדליין
      isLocked: isLate && req.user.role === "Student"
    };
    
    // לוג לבדיקה
    console.log("Adding new assignment with studentId:", newAssignment.studentId);
    console.log("Student role:", req.user.role);
    console.log("User ID:", req.user.id);

    course.assignments.push(newAssignment);
    await course.save();
    console.log("Assignment saved to database with ID:", newAssignment._id);

    // הוספת התראה חדשה למשתמש
    let notificationMessage = "";
    if (isLate) {
      if (isModifiedAfterDeadline) {
        notificationMessage = `Your assignment for ${course.name} was submitted late and the file was modified after the deadline.`;
      } else {
        notificationMessage = `Your assignment for ${course.name} was submitted after the deadline, but the file was last modified before the deadline.`;
      }
    } else {
      notificationMessage = `Your assignment for ${course.name} was submitted successfully before the deadline.`;
    }
    
    // הוספנו בדיקה נוספת למניפולציית זמן
    if (suspectedTimeManipulation) {
      notificationMessage += " Note: Unusual time differences detected between file and server times.";
    }
    
    try {
      if (req.user.role === "Student") {
        await user.addNotification(notificationMessage);
      }
    } catch (err) {
      console.error("Failed to add notification:", err);
    }

    console.log("✅ Assignment successfully saved in database!");
    return res.status(201).json({ 
      message: "Assignment uploaded successfully!", 
      assignment: newAssignment,
      isLate: isLate,
      isModifiedAfterDeadline: isModifiedAfterDeadline,
      suspectedTimeManipulation: suspectedTimeManipulation,
      isLocked: newAssignment.isLocked
    });

  } catch (error) {
    console.error("❌ Server Error while uploading assignment:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
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
      
      course.assignments.push({
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
    
    // ודא שה-ID של הקורס תקין
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID format." });
    }
    
    // ודא שה-ID של המטלה תקין
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ message: "Invalid assignment ID format." });
    }

    const course = await Course.findById(id);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }
    
    // בדיקה שרק המורה או הסטודנט שהגיש יכולים למחוק
    const assignment = course.assignments.id(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    // אם זה סטודנט, בדוק אם זה המטלה שלו ואם היא לא ננעלה
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
    // אם זה מרצה, בדוק אם זה הקורס שלו
    else if (req.user.role === "Teacher" && course.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete assignments in courses you teach." });
    }

    // נסה למחוק את הקובץ מ-Cloudinary אם קיים
    if (assignment.fileUrl) {
      try {
        // חלץ את מזהה הקובץ מה-URL (פתרון ספציפי ל-Cloudinary)
        const publicId = assignment.fileUrl.split('/').pop().split('.')[0];
        
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
          console.log(`✅ File ${publicId} deleted from Cloudinary`);
        }
      } catch (cloudinaryError) {
        console.error("❌ Error deleting file from Cloudinary:", cloudinaryError);
        // ממשיך למרות שגיאה במחיקת הקובץ מ-Cloudinary
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

    // מחיקת כל הקבצים מ-Cloudinary
    for (const assignment of course.assignments) {
      if (assignment.fileUrl) {
        try {
          const publicId = assignment.fileUrl.split('/').pop().split('.')[0];
          if (publicId) {
            await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
          }
        } catch (cloudinaryError) {
          console.error("❌ Error deleting file from Cloudinary:", cloudinaryError);
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