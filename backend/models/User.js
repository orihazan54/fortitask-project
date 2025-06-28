const mongoose = require("mongoose");

// User schema definition with comprehensive security features
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Student", "Teacher"], default: "Student" },
  failedLoginAttempts: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
  twoFactorEnabled: { type: Boolean, default: false },
  resetPasswordCode: { type: String },
  resetPasswordExpiry: { type: Date },
  lateSubmissions: { type: Number, default: 0 },
  submissionsModifiedAfterDeadline: { type: Number, default: 0 },
  lastLogin: { type: Date },
  profileImage: { type: String }, // URL לתמונת הפרופיל
  notifications: [
    {
      message: { type: String },
      date: { type: Date, default: Date.now },
      read: { type: Boolean, default: false }
    }
  ],
  courses: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Course" }
  ]
}, { timestamps: true });

// Strong password validation with detailed security requirements
// מתודה לבדיקת סיסמה חזקה - ביטוי רגולרי מעודכן שתואם לבדיקות שנעשות בצד הלקוח
userSchema.statics.isStrongPassword = function(password) {
  // Comprehensive password requirements: 8+ chars, upper, lower, number, special char
  // שינוי הביטוי הרגולרי כדי לוודא שהוא תואם בדיוק לדרישות מצד הלקוח
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  
  // Individual validation checks for detailed debugging
  // בדיקה יותר פרטנית לכל דרישה בנפרד עם לוגים
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&#]/.test(password);
  const isLongEnough = password && password.length >= 8;
  
  console.log("Backend password validation:");
  console.log("- Password:", password ? "provided" : "missing");
  console.log("- Has lowercase:", hasLowercase);
  console.log("- Has uppercase:", hasUppercase);
  console.log("- Has number:", hasNumber);
  console.log("- Has special char:", hasSpecial);
  console.log("- Min length 8:", isLongEnough);
  console.log("- Password length:", password ? password.length : 0);
  
  // Return comprehensive validation result for security compliance
  // תוצאה סופית
  const result = hasLowercase && hasUppercase && hasNumber && hasSpecial && isLongEnough;
  console.log("- Final manual check:", result);
  console.log("- RegEx check:", passwordRegex.test(password || ""));
  
  // Use manual validation for better reliability with complex passwords
  // החזרת התוצאה של הבדיקה הידנית במקום הביטוי הרגולרי
  // זה עשוי להיות יותר אמין כאשר מתמודדים עם סיסמאות מורכבות
  return result;
};

// Two-Factor Authentication verification with time window tolerance
// פונקציה מותאמת משופרת לבדיקת קוד 2FA
userSchema.statics.verifyTwoFactorCode = function(userSecret, code) {
  const speakeasy = require('speakeasy');
  
  // Sanitize input: remove whitespace and format validation
  // נקיון הקוד מרווחים ואחידות פורמט
  const cleanCode = String(code).trim().replace(/\s+/g, '');
  console.log("2FA code verification:", {
    codeLength: cleanCode.length,
    hasValidFormat: /^\d{6}$/.test(cleanCode)
  });
  
  // Pre-validation: ensure code format is correct
  // בדיקה מקדימה שהקוד בפורמט תקין
  if (!/^\d{6}$/.test(cleanCode)) {
    console.error("Invalid 2FA code format");
    return false;
  }
  
  // Ensure user secret exists for verification
  // וידוא שיש סוד לבדוק מולו
  if (!userSecret) {
    console.error("No secret provided for 2FA verification");
    return false;
  }
  
  // TOTP verification with extended time window for usability
  // פיקס: לגיטי אם אין קוד תקין או סוד
  try {
    // Extended window: 20 periods ≈ 10 minutes for user convenience
    // בדיקה עם טווח זמן רחב (20 תקופות = ~10 דקות)
    const verified = speakeasy.totp.verify({
      secret: userSecret,
      encoding: 'base32',
      token: cleanCode,
      window: 20
    });
    
    console.log("2FA verification result:", verified);
    return verified;
  } catch (error) {
    console.error("2FA verification error:", error);
    return false;
  }
};

// User notification system for in-app messaging
// מתודה להוספת התראה למשתמש
userSchema.methods.addNotification = async function(message) {
  this.notifications.push({ message });
  await this.save();
  return this;
};

// Academic integrity tracking: late submission counter
// מתודה לרישום הגשה באיחור
userSchema.methods.recordLateSubmission = async function() {
  this.lateSubmissions += 1;
  await this.save();
  return this;
};

// Academic integrity tracking: post-deadline modification counter
// מתודה לרישום הגשה שנערכה לאחר דדליין
userSchema.methods.recordModifiedAfterDeadline = async function() {
  this.submissionsModifiedAfterDeadline += 1;
  await this.save();
  return this;
};

const User = mongoose.model("User", userSchema);
module.exports = User;