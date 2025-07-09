const { verifyToken } = require("../utils/jwt.util");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, username: true, email: true },
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

const isProvider = (req, res, next) => {
  if (req.user && req.user.role === "PROVIDER") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as provider" });
  }
};

const isAdmin = (req, res, next) => {
  // Ajoutez votre logique d'admin ici si nécessaire
  next();
};

module.exports = { protect, isProvider, isAdmin };
