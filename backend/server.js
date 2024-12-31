require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit"); // ייבוא express-rate-limit

// ייבוא מסלולים
const userRoutes = require("./routes/userRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // מאפשר עבודה עם JSON בבקשות

// Rate Limiting Middleware
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 דקות
  max: 5, // עד 5 ניסיונות בכל חלון זמן
  message: {
    message: "Too many login attempts. Please try again later.",
  },
});

// הגבלת ניסיונות התחברות לנתיב /login
app.use("/api/users/login", loginLimiter);

// חיבור ל-MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// מסלולים
app.use("/api/users", userRoutes); // מסלולים עבור משתמשים
app.use("/api/assignments", assignmentRoutes); // מסלולים עבור משימות

// האזנה לשרת
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
