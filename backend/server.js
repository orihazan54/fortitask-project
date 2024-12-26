require("dotenv").config(); // טוען את משתני הסביבה מקובץ .env
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// ייבוא מסלולים
const userRoutes = require("./routes/userRoutes");

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

// האזנה לשרת
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
