const { verifyToken } = require("../utils/jwt.util");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authenticateAdmin = async (req, res, next) => {
  const token = req.cookies.adminToken;

  if (!token) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  try {
    const decoded = verifyToken(token);
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true },
    });

    if (!admin) {
      return res.status(401).json({ error: "Compte admin introuvable" });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ error: "Session invalide" });
  }
};

module.exports = authenticateAdmin;
