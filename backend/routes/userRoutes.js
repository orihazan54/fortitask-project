
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { authenticateToken, encryptAES, decryptAES } = require("../middleware/auth");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");

const router = express.Router();

// Setup email transporter using Brevo - UPDATED CONFIGURATION
let transporter;

// Check if we have Brevo SMTP configuration with new setup
if (process.env.BREVO_HOST && process.env.BREVO_USER && process.env.BREVO_PASS) {
  console.log("✅ Brevo email configuration detected - using updated Brevo for emails");
  console.log(`Using email/user: ${process.env.BREVO_USER}`);
  console.log(`SMTP host: ${process.env.BREVO_HOST}`);
  console.log(`SMTP port: ${process.env.BREVO_PORT || 587}`);
  console.log(`From address: ${process.env.BREVO_FROM || process.env.BREVO_USER}`);
  console.log(`SMTP pass format check: ${process.env.BREVO_PASS ? "Provided (length: " + process.env.BREVO_PASS.length + ")" : "Missing"}`);
  
  // Configure nodemailer with updated Brevo SMTP details
  transporter = nodemailer.createTransport({
    host: process.env.BREVO_HOST,
    port: parseInt(process.env.BREVO_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.BREVO_USER,
      pass: process.env.BREVO_PASS,
    },
    debug: true, // Enable debug output
  });
  
  // Verify connection with more detailed logging
  transporter.verify(function(error, success) {
    if (error) {
      console.error("❌ Email configuration error:", error);
      console.error("SMTP connection details used:");
      console.error(`- Host: ${process.env.BREVO_HOST}`);
      console.error(`- Port: ${process.env.BREVO_PORT || 587}`);
      console.error(`- User: ${process.env.BREVO_USER}`);
      console.error(`- Pass: ${process.env.BREVO_PASS ? "[PROVIDED]" : "[MISSING]"}`);
      console.error(`- From: ${process.env.BREVO_FROM || process.env.BREVO_USER}`);
      console.error("Full error:", JSON.stringify(error, null, 2));
      
      // Fall back to console logging
      console.log("⚠️ Falling back to console output for emails");
      transporter = createFallbackTransporter();
    } else {
      console.log("✅ Email server connection verified! Ready to send messages");
    }
  });
} else if (process.env.BREVO_SMTP_KEY && process.env.BREVO_EMAIL) {
  // Fallback to old configuration if new one is not available
  console.log("✅ Using legacy Brevo email configuration");
  console.log(`Using email: ${process.env.BREVO_EMAIL}`);
  
  // Configure nodemailer with Brevo SMTP
  transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.BREVO_EMAIL,
      pass: process.env.BREVO_SMTP_KEY,
    },
    debug: true, // Enable debug output
  });
  
  // Verify connection
  transporter.verify(function(error, success) {
    if (error) {
      console.error("❌ Legacy email configuration error:", error);
      console.error("Full error:", JSON.stringify(error, null, 2));
      
      // Fall back to console logging
      console.log("⚠️ Falling back to console output for emails");
      transporter = createFallbackTransporter();
    } else {
      console.log("✅ Legacy email server is ready to send messages");
    }
  });
} else {
  console.log("⚠️ No email configuration found - using console output for emails");
  // Fallback to console logging for development
  transporter = createFallbackTransporter();
}

// Create a fallback transporter for development
function createFallbackTransporter() {
  return {
    sendMail: (mailOptions) => {
      console.log("\n===== EMAIL WOULD BE SENT =====");
      console.log(`To: ${mailOptions.to}`);
      console.log(`From: ${mailOptions.from}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Content: ${mailOptions.text || mailOptions.html}`);
      if (mailOptions.text) {
        console.log(`🔑 Verification code: ${mailOptions.text.match(/\d{6}/)?.[0] || 'Not found in email'}`);
      }
      console.log("================================\n");
      return Promise.resolve({ messageId: "test-id-" + Date.now() });
    }
  };
}

// Real email sending function with improved debugging
const sendVerificationEmail = async (email, code) => {
  console.log(`🔑 Attempting to send verification code to ${email}: ${code}`);
  
  try {
    // Use updated sender info with BREVO_FROM if available
    const fromEmail = process.env.BREVO_FROM || process.env.BREVO_USER || process.env.BREVO_EMAIL || "fortitask@example.com";
    let senderName = "FortiTask System";
    let senderEmail = fromEmail;
    
    // Parse BREVO_FROM if it's in "Name <email>" format
    if (process.env.BREVO_FROM && process.env.BREVO_FROM.includes('<')) {
      const matches = process.env.BREVO_FROM.match(/(.*)<(.*)>/);
      if (matches && matches.length >= 3) {
        senderName = matches[1].trim() || senderName;
        senderEmail = matches[2].trim() || senderEmail;
        console.log(`Parsed sender from BREVO_FROM: Name="${senderName}", Email="${senderEmail}"`);
      }
    }
    
    // Create email content
    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
      to: email,
      subject: "Password Reset Verification Code",
      text: `Your verification code is: ${code}. This code will expire in 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568; text-align: center;">FortiTask Password Reset</h2>
          <div style="padding: 20px; border: 1px solid #e2e8f0; border-radius: 5px;">
            <p>Hello,</p>
            <p>You requested a password reset for your FortiTask account.</p>
            <p>Your verification code is: <strong style="font-size: 18px; color: #3182ce;">${code}</strong></p>
            <p>This code will expire in <strong>15 minutes</strong>.</p>
            <p>If you did not request a password reset, please ignore this email or contact support.</p>
          </div>
          <p style="text-align: center; color: #718096; font-size: 12px; margin-top: 20px;">
            &copy; ${new Date().getFullYear()} FortiTask. All rights reserved.
          </p>
        </div>
      `
    };
    
    // Extra logging before sending the email
    console.log(`Email sending attempt details:
      From: "${senderName}" <${senderEmail}>
      To: ${email}
      Subject: ${mailOptions.subject}
      Using transporter type: ${transporter.sendMail ? 'Real Transporter' : 'Unknown'}
      Transport config: ${JSON.stringify(transporter?.options || {}, null, 2)}
    `);
    
    // Send the email with extended timeout
    const info = await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Mailer error:", err);
          reject(err);
        } else {
          resolve(info);
        }
      });
    });
    
    console.log(`✅ Email sent successfully: ${info.messageId}`);
    
    // Additional log to see what was actually returned
    console.log("Email sending response:", info);
    
    return true;
  } catch (error) {
    console.error("❌ Email sending error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return false;
  }
};

// רישום משתמש חדש
router.post("/signup", async (req, res) => {
  console.log("Signup request:", req.body); // לוג לבדיקה
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    console.log("Missing fields:", { username, email, password: !!password, role });
    return res.status(400).json({ message: "All fields are required." });
  }

  // בדיקת תוקף סיסמה - נעשה פשוט יותר ונוודא שזה תואם לבדיקה בצד הלקוח
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  const passwordToCheck = req.body.encryptedPassword ? 
    decryptAES(req.body.encryptedPassword) : password;
  
  console.log("Password validation check:", { 
    hasLowercase: /[a-z]/.test(passwordToCheck),
    hasUppercase: /[A-Z]/.test(passwordToCheck),
    hasNumber: /\d/.test(passwordToCheck),
    hasSpecialChar: /[@$!%*?&#]/.test(passwordToCheck),
    length: passwordToCheck.length
  });
    
  if (!passwordRegex.test(passwordToCheck)) {
    console.log("Password validation failed");
    return res.status(400).json({ 
      message: "Password must be at least 8 characters and include uppercase, lowercase, number and special character." 
    });
  }

  try {
    // בדיקה האם המשתמש כבר קיים
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    // הצפנת הסיסמה
    const hashedPassword = await bcrypt.hash(passwordToCheck, 10);
    
    // יצירת מפתח 2FA ייחודי
    const twoFactorSecret = speakeasy.generateSecret({
      name: `Fortitask:${email}`
    });
    
    // יצירת משתמש חדש
    const user = new User({ 
      username, 
      email, 
      password: hashedPassword, 
      role,
      twoFactorSecret: twoFactorSecret.base32,
      twoFactorEnabled: false
    });

    await user.save();
    console.log("User registered successfully:", { id: user._id, email: user.email });
    
    res.status(201).json({ 
      message: "User registered successfully! You can now login.",
      twoFactorQR: await QRCode.toDataURL(twoFactorSecret.otpauth_url)
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// התחברות משתמש
router.post("/login", async (req, res) => {
  const { email, password, twoFactorCode } = req.body;
  
  console.log("Login attempt:", { email, hasTwoFactorCode: !!twoFactorCode });

  try {
    // מציאת המשתמש לפי אימייל
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // בדיקת הסיסמה
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await User.updateOne(
        { _id: user._id }, 
        { $inc: { failedLoginAttempts: 1 } }
      );
      
      // בדיקת ניסיונות התחברות כושלים
      if (user.failedLoginAttempts >= 4) {
        await User.updateOne(
          { _id: user._id }, 
          { isBlocked: true }
        );
        return res.status(401).json({ message: "Account blocked due to multiple failed login attempts. Contact support." });
      }
      
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // בדיקת 2FA אם מופעל
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        console.log("2FA is enabled but no code provided");
        return res.status(400).json({ 
          message: "Two-factor authentication code required.",
          requiresTwoFactor: true
        });
      }
      
      // Clean and format the code before verification
      const cleanCode = String(twoFactorCode).trim().replace(/\s+/g, '');
      console.log("Cleaned 2FA code for verification:", cleanCode);
      
      // שימוש בפונקציה המשופרת מהמודל
      const verified = User.verifyTwoFactorCode(user.twoFactorSecret, cleanCode);
      console.log("2FA verification result:", verified);
      
      if (!verified) {
        // Additional debug info
        const now = new Date();
        console.log("Verification time:", now.toISOString(), "Unix time:", Math.floor(now.getTime() / 1000));
        
        return res.status(401).json({ 
          message: "Invalid two-factor authentication code.",
          requiresTwoFactor: true  // Keep 2FA mode active even when code is wrong
        });
      }
      
      console.log("2FA verified successfully");
    }

    // איפוס ניסיונות התחברות כושלים
    await User.updateOne(
      { _id: user._id }, 
      { 
        failedLoginAttempts: 0, 
        isBlocked: false,
        lastLogin: new Date()
      }
    );

    // יצירת טוקן התחברות
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "12h" }
    );
    
    // Log successful login
    console.log("Login successful:", { userId: user._id, role: user.role });
    
    res.status(200).json({ 
      token, 
      role: user.role,
      userId: user._id,
      username: user.username
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// פרטי פרופיל משתמש
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, "-password -twoFactorSecret");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Failed to fetch profile." });
  }
});

// עדכון פרטי משתמש
router.put("/profile", authenticateToken, async (req, res) => {
  const { username, email, password, currentPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    
    if (password) {
      // בדיקת הסיסמה הנוכחית לפני שאנו מאפשרים עדכון סיסמה
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to update password." });
      }
      
      // בדיקה שהסיסמה הנוכחית נכונה
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect." });
      }
      
      // בדיקת תוקף סיסמה חדשה
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      const passwordToCheck = req.body.encryptedPassword ? 
        decryptAES(req.body.encryptedPassword) : password;
        
      if (!passwordRegex.test(passwordToCheck)) {
        return res.status(400).json({ 
          message: "Password must be at least 8 characters and include uppercase, lowercase, number and special character." 
        });
      }
      updates.password = await bcrypt.hash(passwordToCheck, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id, 
      updates, 
      { new: true, select: "-password -twoFactorSecret" }
    );
    
    res.status(200).json({ 
      message: "Profile updated successfully.", 
      user: updatedUser 
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile." });
  }
});

// הגדרת אימות דו-שלבי
router.get("/setup-2fa", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // יצירת מפתח 2FA חדש בכל מקרה לוודא שזה תקין
    const secret = speakeasy.generateSecret({
      name: `Fortitask:${user.email}`,
      issuer: 'Fortitask'
    });
    
    // שמירת המפתח החדש
    user.twoFactorSecret = secret.base32;
    await user.save();
    
    // יצירת קוד QR חדש
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    console.log("Generated new 2FA secret:", {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url
    });
    
    res.status(200).json({
      message: "Two-factor authentication setup initiated.",
      secret: secret.base32,
      qrCode: qrCodeUrl,
      enabled: user.twoFactorEnabled
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    res.status(500).json({ message: "Failed to setup two-factor authentication." });
  }
});

// אימות והפעלת אבטחה דו-שלבית - שיפור לשימוש בפונקציה המשופרת
router.post("/validate-2fa", authenticateToken, async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ message: "Verification code is required." });
  }
  
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    
    console.log("Validating 2FA code:", {
      providedCode: code,
      hasSecret: !!user.twoFactorSecret,
      userId: req.user.id,
      codeLength: String(code).length
    });
    
    // בדיקת הקוד מול המפתח באמצעות הפונקציה המשופרת במודל המשתמש
    const verified = User.verifyTwoFactorCode(user.twoFactorSecret, code);
    console.log("2FA verification result for validation:", verified);
    
    if (!verified) {
      return res.status(400).json({ message: "Invalid verification code." });
    }
    
    // הפעלת 2FA
    user.twoFactorEnabled = true;
    await user.save();
    
    res.status(200).json({ message: "Two-factor authentication enabled successfully." });
  } catch (error) {
    console.error("2FA validation error:", error);
    res.status(500).json({ message: "Failed to validate two-factor authentication." });
  }
});

// ביטול אבטחה דו-שלבית - שיפור לשימוש בפונקציה המשופרת
router.post("/disable-2fa", authenticateToken, async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    console.error("❌ No verification code provided");
    return res.status(400).json({ message: "Verification code is required." });
  }
  
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      console.error("❌ User not found:", req.user.id);
      return res.status(404).json({ message: "User not found." });
    }
    
    if (!user.twoFactorEnabled) {
      console.log("ℹ️ 2FA already disabled for user:", req.user.id);
      return res.status(200).json({ message: "Two-factor authentication is already disabled." });
    }
    
    // בדיקת הקוד באמצעות הפונקציה המשופרת במודל המשתמש
    console.log("Disabling 2FA, verifying code:", {
      providedCode: code,
      codeLength: String(code).length,
      userHasSecret: !!user.twoFactorSecret,
      secretLength: user.twoFactorSecret?.length
    });
    
    // Make sure user has a secret
    if (!user.twoFactorSecret) {
      console.error("❌ User has no 2FA secret:", req.user.id);
      return res.status(400).json({ message: "Two-factor authentication is not properly set up." });
    }
    
    // וידוא הקוד לפני ביטול באמצעות הפונקציה המשופרת במודל המשתמש
    const verified = User.verifyTwoFactorCode(user.twoFactorSecret, code);
    console.log("2FA verification result for disabling:", verified);
    
    if (!verified) {
      // Additional debug info
      const now = new Date();
      console.log("Verification time:", now.toISOString(), "Unix time:", Math.floor(now.getTime() / 1000));
      
      return res.status(400).json({ message: "Invalid verification code." });
    }
    
    // ביטול 2FA
    user.twoFactorEnabled = false;
    await user.save();
    
    console.log("✅ 2FA disabled successfully for user:", req.user.id);
    
    res.status(200).json({ message: "Two-factor authentication disabled successfully." });
  } catch (error) {
    console.error("❌ 2FA disable error:", error);
    return res.status(500).json({ message: "Failed to disable two-factor authentication." });
  }
});

// שליחת קוד אימות לאיפוס סיסמה - FIXED IMPLEMENTATION
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

    // יצירת קוד אימות
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiry = new Date();
    codeExpiry.setMinutes(codeExpiry.getMinutes() + 15); // תוקף ל-15 דקות
    
    // שמירת הקוד בדאטהבייס
    user.resetPasswordCode = verificationCode;
    user.resetPasswordExpiry = codeExpiry;
    await user.save();

    // שליחת הקוד באימייל - IMPROVED WITH BETTER LOGS
    console.log("Attempting to send email with verification code");
    const emailSent = await sendVerificationEmail(email, verificationCode);

    console.log("Password reset code generated:", {
      email,
      code: verificationCode,
      expiry: codeExpiry,
      emailSent
    });

    res.status(200).json({ 
      message: "Verification code sent to your email.",
      // For development purposes, include the code in the response
      verificationCode: process.env.NODE_ENV === 'production' ? undefined : verificationCode
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to send verification code." });
  }
});

// אימות קוד ושינוי סיסמה - FIXED IMPLEMENTATION
router.post("/reset-password", async (req, res) => {
  const { email, verificationCode, newPassword } = req.body;
  console.log("Reset password request received:", { 
    email, 
    codeProvided: !!verificationCode,
    codeLength: verificationCode?.length,
    passwordProvided: !!newPassword,
    password: newPassword?.substring(0, 3) + '...'  // רק לוג חלקי מטעמי אבטחה
  });

  if (!email || !verificationCode || !newPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Find user with matching email and valid reset code
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log("User not found for password reset:", email);
      return res.status(404).json({ message: "User not found." });
    }
    
    console.log("User found, checking verification code:", {
      userCode: user.resetPasswordCode,
      providedCode: verificationCode,
      codeExpiry: user.resetPasswordExpiry,
      isExpired: user.resetPasswordExpiry < new Date(),
      passwordFormat: {
        length: newPassword?.length,
        hasLowercase: /[a-z]/.test(newPassword),
        hasUppercase: /[A-Z]/.test(newPassword),
        hasNumber: /\d/.test(newPassword),
        hasSpecialChar: /[@$!%*?&#]/.test(newPassword),
      }
    });
    
    // Check if verification code matches and is not expired
    if (user.resetPasswordCode !== verificationCode || !user.resetPasswordExpiry || user.resetPasswordExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired verification code." });
    }

    // הורדת קוד ההצפנה כדי לבדוק את הסיסמה המקורית ישירות
    let passwordToCheck = newPassword;
    if (req.body.encryptedPassword) {
      try {
        passwordToCheck = decryptAES(req.body.encryptedPassword);
        console.log("Successfully decrypted password");
      } catch (e) {
        console.log("Error decrypting password:", e);
        passwordToCheck = newPassword;
      }
    }
    
    // בדיקת תוקף סיסמה חדשה
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    
    // מדפיס למטרת ניפוי באגים (בלי הסיסמה עצמה)
    console.log("Password validation check:", { 
      hasLowercase: /[a-z]/.test(passwordToCheck),
      hasUppercase: /[A-Z]/.test(passwordToCheck),
      hasNumber: /\d/.test(passwordToCheck),
      hasSpecialChar: /[@$!%*?&#]/.test(passwordToCheck),
      length: passwordToCheck.length,
      regexTest: passwordRegex.test(passwordToCheck)
    });
      
    if (!passwordRegex.test(passwordToCheck)) {
      console.log("Password validation failed");
      return res.status(400).json({ 
        message: "Password must be at least 8 characters and include uppercase, lowercase, number and special character." 
      });
    }

    // הצפנת הסיסמה החדשה
    const hashedPassword = await bcrypt.hash(passwordToCheck, 10);
    
    // עדכון הסיסמה וניקוי קוד האימות
    user.password = hashedPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    console.log("Password reset successful for user:", email);
    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password." });
  }
});

// מחיקת חשבון
router.delete("/account", authenticateToken, async (req, res) => {
  try {
    // מחיקת המשתמש
    await User.findByIdAndDelete(req.user.id);
    res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("Account deletion error:", error);
    res.status(500).json({ message: "Failed to delete account." });
  }
});

module.exports = router;