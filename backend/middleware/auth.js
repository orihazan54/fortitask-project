
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");

// פונקציית טיפול בטוקן והרשאות
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.error("❌ No Authorization header provided.");
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.error("❌ No token found in Authorization header.");
    return res.status(401).json({ message: "Access denied. Invalid token format." });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      console.error("❌ Token verification failed:", err.message);
      return res.status(403).json({ message: "Invalid or expired token." });
    }
    
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

// פונקציית הצפנת AES
const encryptAES = (text, key = process.env.ENCRYPTION_KEY) => {
  // יצירת IV (וקטור אתחול) ייחודי
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  
  // הצפנת הטקסט
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // החזרת התוצאה כ-IV והטקסט המוצפן מופרדים בנקודתיים
  return iv.toString('hex') + ':' + encrypted;
};

// פונקציית פענוח AES
const decryptAES = (text, key = process.env.ENCRYPTION_KEY) => {
  // חילוץ ה-IV והטקסט המוצפן
  const textParts = text.split(':');
  const iv = Buffer.from(textParts[0], 'hex');
  const encryptedText = textParts[1];
  
  // פענוח הטקסט
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

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