
require("dotenv").config();
const { cloudinary } = require("./config/cloudinary");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

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

// מסלול בדיקה
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// טיפול בקבצי מטא-דאטה
app.post("/api/analyze-metadata", (req, res) => {
  try {
    const { fileData } = req.body;
    if (!fileData) {
      return res.status(400).json({ message: "No file data provided" });
    }
    
    // Extract metadata from file
    const { lastModified, name, size, type } = fileData;
    
    // Compare with server time to detect time manipulation
    const clientTime = new Date(lastModified);
    const serverTime = new Date();
    const timeDifference = Math.abs(serverTime - clientTime);
    
    // If time difference is too large (more than 1 hour), it might indicate manipulation
    const possibleManipulation = timeDifference > 3600000;
    
    res.status(200).json({
      fileName: name,
      fileSize: size,
      fileType: type,
      lastModified: new Date(lastModified).toISOString(),
      serverTime: serverTime.toISOString(),
      timeDifference,
      possibleManipulation
    });
  } catch (error) {
    console.error("Error analyzing metadata:", error);
    res.status(500).json({ message: "Failed to analyze metadata" });
  }
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