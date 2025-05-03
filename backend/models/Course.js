
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
      fileName: String,  // Original file name
      displayName: String, // UTF-8 encoded display name
      uploadedAt: { type: Date, default: Date.now },
      lastModified: { type: Date }, // Server verified last modified date
      lastModifiedUTC: { type: Date }, // Server verified last modified date in UTC (more reliable)
      clientReportedDate: { type: Date }, // Client reported modification date (possibly manipulated)
      dateDiscrepancy: { type: Boolean, default: false }, // Flag for discrepancy between client and server dates
      originalSize: { type: Number }, // Original file size
      fileType: { type: String }, // File type
      isLateSubmission: { type: Boolean, default: false }, // Late submission flag
      isModifiedAfterDeadline: { type: Boolean, default: false }, // Modified after deadline flag
      suspectedTimeManipulation: { type: Boolean, default: false }, // Flag for suspicious time differences
      studentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: function() { return !this.isMaterial; } // Required for student submissions
      },
      studentName: { type: String }, // Student name for quick display
      studentEmail: { type: String }, // Student email for quick display
      isMaterial: { type: Boolean, default: false }, // Flag for instructor materials
      submissionComment: { type: String }, // Optional submission comment
      isLocked: { type: Boolean, default: false }, // Flag to indicate if assignment is locked
      serverReceivedTime: { type: Date, default: Date.now }, // Server-side timestamp for when file was received
    },
  ],
}, 
{ timestamps: true });

// Helper method to populate student information in assignments
courseSchema.methods.populateStudentInfo = async function() {
  const User = mongoose.model("User");
  
  // Only process assignments that are student submissions and missing student info
  const needsPopulation = this.assignments.filter(a => 
    !a.isMaterial && 
    a.studentId && 
    (!a.studentName || !a.studentEmail)
  );
  
  if (needsPopulation.length > 0) {
    // Get unique student IDs
    const studentIds = [...new Set(needsPopulation.map(a => a.studentId))];
    
    // Fetch student information in one query
    const students = await User.find({ 
      _id: { $in: studentIds } 
    }, { username: 1, email: 1 });
    
    // Create a map for quick lookup
    const studentMap = students.reduce((map, student) => {
      map[student._id.toString()] = { 
        name: student.username, 
        email: student.email 
      };
      return map;
    }, {});
    
    // Update assignments with student information
    this.assignments = this.assignments.map(assignment => {
      if (!assignment.isMaterial && assignment.studentId) {
        const studentId = assignment.studentId.toString();
        const studentInfo = studentMap[studentId];
        
        if (studentInfo) {
          assignment.studentName = studentInfo.name;
          assignment.studentEmail = studentInfo.email;
        }
      }
      return assignment;
    });
    
    // Save the updated document
    await this.save();
  }
  
  return this;
};

// Pre-save hook to ensure student info is populated
courseSchema.pre('save', async function(next) {
  // If this is a new document or assignments were modified, populate student info
  if (this.isNew || this.isModified('assignments')) {
    try {
      // Find assignments that need student info populated
      const needsInfo = this.assignments.some(a => 
        !a.isMaterial && a.studentId && (!a.studentName || !a.studentEmail)
      );
      
      if (needsInfo) {
        const User = mongoose.model("User");
        
        // Get unique student IDs
        const studentIds = [...new Set(
          this.assignments
            .filter(a => !a.isMaterial && a.studentId)
            .map(a => a.studentId)
        )];
        
        if (studentIds.length > 0) {
          // Fetch student information
          const students = await User.find({ 
            _id: { $in: studentIds } 
          }, { username: 1, email: 1 });
          
          // Create lookup map
          const studentMap = students.reduce((map, student) => {
            map[student._id.toString()] = { 
              name: student.username, 
              email: student.email 
            };
            return map;
          }, {});
          
          // Update assignments with student info
          this.assignments = this.assignments.map(assignment => {
            if (!assignment.isMaterial && assignment.studentId) {
              const studentId = assignment.studentId.toString();
              const studentInfo = studentMap[studentId];
              
              if (studentInfo) {
                assignment.studentName = studentInfo.name;
                assignment.studentEmail = studentInfo.email;
              }
            }
            return assignment;
          });
        }
      }
    } catch (error) {
      console.error("Error in pre-save hook:", error);
    }
  }
  next();
});

module.exports = mongoose.model("Course", courseSchema);