
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// קונפיגורציה של cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// הגדרת Storage עבור קבצים
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'fortitask',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xlsx', 'pptx', 'txt'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

// יצירת multer עם Storage של cloudinary
const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };