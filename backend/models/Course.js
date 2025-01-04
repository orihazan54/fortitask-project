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
  filePath: { type: String }, // נתיב הקובץ (אופציונלי)
  fileUrl: { type: String }, // URL להורדת הקובץ (אופציונלי)
}, 
{ timestamps: true }); // הוספת תאריך יצירה ועדכון אוטומטי

module.exports = mongoose.model("Course", courseSchema);
