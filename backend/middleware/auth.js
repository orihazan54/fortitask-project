const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.error("❌ No Authorization header provided.");
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.error("❌ No token found in Authorization header.");
    return res.status(401).json({ message: "Access denied. Invalid token format." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error("❌ Token verification failed:", err.message);
      return res.status(403).json({ message: "Invalid or expired token." });
    }
    req.user = user;
    console.log("✅ User authenticated:", user);
    next();
  });
};

module.exports = { authenticateToken };
