
const mongoose = require("mongoose");

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

// מתודה לבדיקת סיסמה חזקה
userSchema.statics.isStrongPassword = function(password) {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// מתודה להוספת התראה למשתמש
userSchema.methods.addNotification = async function(message) {
  this.notifications.push({ message });
  await this.save();
  return this;
};

// מתודה לרישום הגשה באיחור
userSchema.methods.recordLateSubmission = async function() {
  this.lateSubmissions += 1;
  await this.save();
  return this;
};

// מתודה לרישום הגשה שנערכה לאחר דדליין
userSchema.methods.recordModifiedAfterDeadline = async function() {
  this.submissionsModifiedAfterDeadline += 1;
  await this.save();
  return this;
};

const User = mongoose.model("User", userSchema);
module.exports = User;