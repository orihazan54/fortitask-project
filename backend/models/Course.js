
const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  creditPoints: { type: Number, required: true },
  instructions: { type: String, required: true },
  deadline: { type: Date, required: true },
  teacherId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }, // קישור למשתמש המרצה
  students: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  ], // רשימת סטודנטים שנרשמו
  assignments: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      fileUrl: String,
      fileName: String,
      uploadedAt: { type: Date, default: Date.now },
      lastModified: { type: Date }, // תאריך העריכה האחרון של הקובץ
      originalSize: { type: Number }, // גודל הקובץ המקורי
      fileType: { type: String }, // סוג הקובץ
    },
  ], // מערך מטלות לכל קורס
}, 
{ timestamps: true });

module.exports = mongoose.model("Course", courseSchema);