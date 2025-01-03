const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const Course = require("../models/Course"); // מודל הקורסים

// הגדרת Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// הגדרת multer לאחסון ב-Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "courses", // תיקייה ב-Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "pdf", "docx"],
  },
});
const upload = multer({ storage });

// -------------------- קורסים -------------------- //

// יצירת קורס חדש (למורים בלבד)
router.post("/create", authenticateToken, upload.single("file"), async (req, res) => {
  if (req.user.role !== "Teacher") {
    return res.status(403).json({ message: "Access denied. Only teachers can create courses." });
  }

  const { courseName, creditPoints, instructions, deadline } = req.body;

  if (!courseName || !creditPoints || !instructions || !deadline || !req.file) {
    return res.status(400).json({ message: "All course details and file are required." });
  }

  try {
    const teacherName = req.user.name || "Unknown Teacher"; // שם המרצה מתוך הטוקן

    const newCourse = new Course({
      name: courseName,
      creditPoints: parseFloat(creditPoints),
      instructions,
      deadline: new Date(deadline),
      filePath: req.file.path,
      fileUrl: req.file.path, // כתובת הקובץ ב-Cloudinary
      teacherId: req.user.id,
      teacherName, // שמירת שם המרצה
    });

    await newCourse.save();
    return res.status(201).json({
      message: "Course created successfully!",
      course: newCourse,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    return res.status(500).json({ message: "Failed to create course.", error });
  }
});

// קבלת כל הקורסים (לסטודנטים ומורים)
router.get("/", authenticateToken, async (req, res) => {
  try {
    let courses;
    if (req.user.role === "Student") {
      courses = await Course.find({});
    } else if (req.user.role === "Teacher") {
      courses = await Course.find({ teacherId: req.user.id });
    } else {
      return res.status(403).json({ message: "Access denied. Invalid role." });
    }

    return res.status(200).json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return res.status(500).json({ message: "Failed to fetch courses." });
  }
});

// הרשמה לקורס (לסטודנטים בלבד)
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
    console.error("Error registering to course:", error);
    return res.status(500).json({ message: "Failed to register to course." });
  }
});

// קבלת פרטי קורס מסוים
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    if (req.user.role === "Student" && !course.students.includes(req.user.id)) {
      return res.status(403).json({ message: "You are not registered for this course." });
    }

    if (req.user.role === "Teacher" && course.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not the teacher of this course." });
    }

    return res.status(200).json(course);
  } catch (error) {
    console.error("Error fetching course details:", error);
    return res.status(500).json({ message: "Failed to fetch course details." });
  }
});

// מחיקת קורס (למורים בלבד)
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
    console.error("Error deleting course:", error);
    return res.status(500).json({ message: "Failed to delete course." });
  }
});

// עדכון קורס (למורים בלבד)
router.put("/:id", authenticateToken, upload.single("file"), async (req, res) => {
  if (req.user.role !== "Teacher") {
    return res
      .status(403)
      .json({ message: "Access denied. Only teachers can update courses." });
  }

  const { id } = req.params;
  const { name, creditPoints, instructions, deadline } = req.body;

  try {
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    if (course.teacherId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only update courses you created." });
    }

    // עדכון פרטי הקורס
    course.name = name || course.name;
    course.creditPoints = creditPoints || course.creditPoints;
    course.instructions = instructions || course.instructions;
    course.deadline = deadline ? new Date(deadline) : course.deadline;

    // עדכון קובץ אם קיים
    if (req.file) {
      course.filePath = req.file.path;
      course.fileUrl = req.file.path; // עדכון ה-URL של Cloudinary
    }

    await course.save();
    return res.status(200).json(course);
  } catch (error) {
    console.error("Error updating course:", error);
    return res.status(500).json({ message: "Failed to update course." });
  }
});


module.exports = router;
