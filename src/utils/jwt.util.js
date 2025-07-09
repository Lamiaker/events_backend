const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
// Liste noire pour les tokens révoqués
const tokenBlacklist = new Set();
const generateToken = (userId, role) => {
  return jwt.sign(
    {
      userId,
      role,
      iat: Math.floor(Date.now() / 1000), // issued at
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
      algorithm: "HS256", // Spécifier explicitement l'algorithme
    }
  );
};

const verifyToken = (token) => {
  if (tokenBlacklist.has(token)) {
    throw new Error("Token revoked");
  }
  return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
};

const revokeToken = (token) => {
  tokenBlacklist.add(token);
};

module.exports = { generateToken, verifyToken, revokeToken };
