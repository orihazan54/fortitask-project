
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
  },
  students: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  ],
  assignments: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      fileUrl: String,
      fileName: String,
      uploadedAt: { type: Date, default: Date.now },
      lastModified: { type: Date }, // תאריך העריכה האחרון של הקובץ
      originalSize: { type: Number }, // גודל הקובץ המקורי
      fileType: { type: String }, // סוג הקובץ
      isLateSubmission: { type: Boolean, default: false }, // האם הוגש באיחור
      isModifiedAfterDeadline: { type: Boolean, default: false }, // האם הקובץ נערך אחרי הדדליין
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // מזהה הסטודנט שהגיש
    },
  ],
}, 
{ timestamps: true });

module.exports = mongoose.model("Course", courseSchema);