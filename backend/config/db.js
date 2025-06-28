const mongoose = require("mongoose");

// MongoDB database connection configuration with error handling
const connectDB = async () => {
  try {
    // Connect to MongoDB with modern connection options
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected");
  } catch (error) {
    // Critical failure: exit process if database connection fails
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
