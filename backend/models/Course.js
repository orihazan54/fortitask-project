const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  creditPoints: { type: Number, required: true },
  instructions: { type: String, required: true },
  deadline: { type: Date, required: true },
  filePath: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  teacherName: { type: String, required: true }, // הוספת שם המרצה
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("Course", courseSchema);
