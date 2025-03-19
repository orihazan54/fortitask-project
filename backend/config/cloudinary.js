const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config(); // טעינת משתני ה- `.env`

// 📌 הגדרת חיבור ל-Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("✅ Cloudinary Config:");
console.log("CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API_KEY:", process.env.CLOUDINARY_API_KEY ? "Loaded" : "Missing");
console.log("API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "Loaded" : "Missing");

// 📂 הגדרת אחסון קבצים ב-Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "assignments", // שם התיקייה בענן שבה יאוחסנו הקבצים
    allowed_formats: ["jpg", "jpeg", "png", "pdf", "docx"], // סוגי קבצים מותרים
  },
});

// 📌 הגדרת Multer להעלאת קבצים
const upload = multer({ storage });

// 🔍 בדיקה אם החיבור ל-Cloudinary עובד
cloudinary.api.ping()
  .then(() => console.log("✅ Cloudinary Connection Successful!"))
  .catch((error) => console.error("❌ Cloudinary Connection Failed!", error));

module.exports = { cloudinary, upload };
