
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage configuration for files - supports all file types
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'fortitask',
    resource_type: 'auto', // Allows all file types
    use_filename: true,
    unique_filename: true,
    format: async (req, file) => {
      return 'auto'; // Keep original format
    },
    public_id: (req, file) => {
      // Generate a file name without special characters for storage
      const now = Date.now();
      const sanitizedFileName = file.originalname
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 40); // Limit length for URL compatibility
      
      return `${now}_${sanitizedFileName}`;
    },
    transformation: [
      { flags: "attachment" } // Force file to be downloadable
    ]
  },
});

// Create multer with cloudinary storage
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  fileFilter: (req, file, cb) => {
    // Accept all file types
    cb(null, true);
  }
});

module.exports = { cloudinary, upload };