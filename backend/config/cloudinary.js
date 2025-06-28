const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cloudinary cloud storage configuration for file management
// הגדרת Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Advanced storage configuration with dynamic file handling
// הגדרת אחסון עבור קבצים - תומך בכל סוגי הקבצים
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'fortitask',
    resource_type: 'auto', // מאפשר את כל סוגי הקבצים
    use_filename: true,
    unique_filename: true,
    format: async (req, file) => {
      console.log("Cloudinary processing file:", file.originalname);
      // Preserve original file extension for compatibility
      // Keep the original file extension if possible
      const originalExt = file.originalname.split('.').pop();
      if (originalExt && originalExt.length <= 4) {
        return originalExt; // שמירת סיומת הקובץ המקורי
      }
      return 'auto'; // שמירה על פורמט מקורי
    },
    public_id: (req, file) => {
      // Generate secure, URL-safe filename with timestamp
      // יצירת שם קובץ ללא תווים מיוחדים לאחסון
      const now = Date.now();
      const sanitizedFileName = file.originalname
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 40); // הגבלת אורך לתאימות URL
      
      console.log("Generated public_id:", `${now}_${sanitizedFileName}`);
      return `${now}_${sanitizedFileName}`;
    },
  },
});

// Multer configuration with security constraints and file validation
// יצירת multer עם אחסון cloudinary
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // הגבלת גודל קובץ ל-10MB
  fileFilter: (req, file, cb) => {
    // Accept all file types for academic submission flexibility
    // קבלת כל סוגי הקבצים
    console.log("Multer processing file:", file.originalname, file.mimetype);
    cb(null, true);
  }
});

// Connection health check for Cloudinary service availability
// בדיקת חיבור ל-Cloudinary
const testCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log("✅ Cloudinary connection test successful:", result);
    return true;
  } catch (error) {
    console.error("❌ Cloudinary connection test failed:", error);
    return false;
  }
};

// Skip connection test in testing environment to avoid external dependencies
if (process.env.NODE_ENV !== 'test') {
testCloudinaryConnection();
}

module.exports = { cloudinary, upload, testCloudinaryConnection };