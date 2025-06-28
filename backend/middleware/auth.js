const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");

// JWT token validation and user authentication middleware
// פונקציית טיפול בטוקן והרשאות
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.error("❌ No Authorization header provided.");
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  // Extract Bearer token from Authorization header
  const token = authHeader.split(" ")[1];
  if (!token) {
    console.error("❌ No token found in Authorization header.");
    return res.status(401).json({ message: "Access denied. Invalid token format." });
  }

  // Verify JWT token signature and expiration
  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      console.error("❌ Token verification failed:", err.message);
      return res.status(403).json({ message: "Invalid or expired token." });
    }
    
    // Additional user validation: check if user exists and is active
    // בדיקת האם המשתמש קיים ולא נחסם
    try {
      const userExists = await User.findById(user.id);
      if (!userExists || userExists.isBlocked) {
        return res.status(403).json({ message: "User is inactive or blocked." });
      }
      
      req.user = user;
      console.log("✅ User authenticated:", user);
      next();
    } catch (error) {
      console.error("❌ Error checking user status:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  });
};

// AES encryption utility for sensitive data storage
// פונקציית הצפנת AES
const encryptAES = (text, key = process.env.ENCRYPTION_KEY) => {
  // Generate unique initialization vector for each encryption
  // יצירת IV (וקטור אתחול) ייחודי
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  
  // Encrypt the plaintext data
  // הצפנת הטקסט
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV and encrypted text concatenated with separator
  // החזרת התוצאה כ-IV והטקסט המוצפן מופרדים בנקודתיים
  return iv.toString('hex') + ':' + encrypted;
};

// AES decryption utility for retrieving sensitive data
// פונקציית פענוח AES
const decryptAES = (text, key = process.env.ENCRYPTION_KEY) => {
  // Extract IV and encrypted text from stored format
  // חילוץ ה-IV והטקסט המוצפן
  const textParts = text.split(':');
  const iv = Buffer.from(textParts[0], 'hex');
  const encryptedText = textParts[1];
  
  // Decrypt using the same IV that was used for encryption
  // פענוח הטקסט
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Role-based access control middleware
// פונקציית וידוא הרשאות לפי תפקיד
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Access denied. You don't have permission to perform this action." 
      });
    }
    next();
  };
};

module.exports = { authenticateToken, encryptAES, decryptAES, authorizeRole };