const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const memoryCache = require("memory-cache");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// רישום משתמש חדש
router.post("/signup", async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const commonPasswords = ["123456", "password", "qwerty", "abc123", "123123"];
  if (commonPasswords.includes(password)) {
    return res.status(400).json({ message: "Password is too common." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, role });

    await user.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// התחברות משתמש
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ token, role: user.role });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// פרטי פרופיל משתמש
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, "-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Log the user's role to ensure it's set correctly
    console.log("User role from backend:", user.role);

    res.status(200).json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Failed to fetch profile." });
  }
});

// עדכון סיסמה
router.put("/profile", authenticateToken, async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Password is required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });
    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile." });
  }
});

// שליחת קוד אימות לאיפוס סיסמה
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    memoryCache.put(email, verificationCode, 15 * 60 * 1000);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Verification Code",
      html: `<h1>Password Reset Code</h1><p>Your verification code is:</p><h2>${verificationCode}</h2>`,
    });

    res.status(200).json({ message: "Verification code sent to your email." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to send verification code." });
  }
});

// אימות קוד ושינוי סיסמה
router.post("/reset-password", async (req, res) => {
  const { email, verificationCode, newPassword } = req.body;

  if (!email || !verificationCode || !newPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const cachedCode = memoryCache.get(email);
    if (!cachedCode || cachedCode !== parseInt(verificationCode, 10)) {
      return res.status(400).json({ message: "Invalid verification code." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    memoryCache.del(email);

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password." });
  }
});

module.exports = router;
