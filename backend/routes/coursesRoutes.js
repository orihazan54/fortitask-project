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
    allowed_formats: ["jpg", "jpeg", "png", "pdf", "docx"],
    resource_type: "auto", // מאפשר העלאת כל סוגי הקבצים
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
      });
    }

    await newCourse.save();
    return res.status(201).json({ message: "Course created successfully!", course: newCourse });
  } catch (error) {
    console.error("❌ Error creating course:", error);
    return res.status(500).json({ message: "Failed to create course.", error });
  }
});

// 📂 העלאת מטלה ל-Cloudinary
router.post("/:id/upload-assignment", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    console.log("📥 File upload request received for Course ID:", req.params.id);
    
    if (!req.file) {
      console.error("❌ No file received!");
      return res.status(400).json({ message: "No file uploaded!" });
    }

    console.log("🚀 Uploading file to Cloudinary...");
    console.log("File details:", {
      name: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path,
      lastModified: req.file.lastModified
    });

    const course = await Course.findById(req.params.id);
    if (!course) {
      console.error("❌ Course not found!");
      return res.status(404).json({ message: "Course not found!" });
    }

    const newAssignment = {
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      uploadedAt: new Date(),
      lastModified: req.file.lastModified ? new Date(req.file.lastModified) : new Date(),
      originalSize: req.file.size,
      fileType: req.file.mimetype
    };

    course.assignments.push(newAssignment);
    await course.save();

    console.log("✅ Assignment successfully saved in database!");
    return res.status(201).json({ message: "Assignment uploaded successfully!", assignment: newAssignment });

  } catch (error) {
    console.error("❌ Server Error while uploading assignment:", JSON.stringify(error, null, 2));
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

    return res.status(200).json(courses);
  } catch (error) {
    console.error("❌ Error fetching courses:", error);
    return res.status(500).json({ message: "Failed to fetch courses." });
  }
});

// 📌 שליפת קורס לפי מזהה
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("students", "username email");
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    return res.status(200).json(course);
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
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    if (course.students.includes(req.user.id)) {
      return res.status(400).json({ message: "You are already registered for this course." });
    }

    course.students.push(req.user.id);
    await course.save();

    return res.status(200).json({ message: "Successfully registered to the course.", course });
  } catch (error) {
    console.error("❌ Error registering to course:", error);
    return res.status(500).json({ message: "Failed to register to course." });
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

    await course.deleteOne();
    return res.status(200).json({ message: "Course deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting course:", error);
    return res.status(500).json({ message: "Failed to delete course." });
  }
});

// 📂 קבלת מטלות של קורס
router.get("/:id/assignments", authenticateToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    return res.status(200).json(course.assignments);
  } catch (error) {
    console.error("❌ Error fetching assignments:", error);
    return res.status(500).json({ message: "Failed to fetch assignments." });
  }
});

// 📌 מחיקת מטלה מקורס
router.delete("/:id/assignments/:assignmentId", authenticateToken, async (req, res) => {
  if (req.user.role !== "Teacher") {
    return res.status(403).json({ message: "Access denied. Only teachers can delete assignments." });
  }

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
    
    if (course.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete assignments in courses you teach." });
    }

    // מצא את המטלה לפי ID
    const assignment = course.assignments.id(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
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

module.exports = router;