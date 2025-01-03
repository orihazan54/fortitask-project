require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// ייבוא מסלולים
const userRoutes = require("./routes/userRoutes");
const coursesRoutes = require("./routes/coursesRoutes"); // מיזוג משימות וקורסים

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // מאפשר עבודה עם JSON בבקשות

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
app.use("/api/courses", coursesRoutes); // מסלולים עבור קורסים ומשימות

// האזנה לשרת
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
