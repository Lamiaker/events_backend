const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const securityLogger = async (req, res, next) => {
  const suspiciousActivities = [
    "SQL injection attempt",
    "XSS attempt",
    "Brute force attempt",
    "Invalid token",
  ];

  // Log les activités suspectes
  if (
    suspiciousActivities.some((activity) => req.originalUrl.includes(activity))
  ) {
    await prisma.securityLog.create({
      data: {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        action: "Suspicious activity detected",
        details: JSON.stringify({
          url: req.originalUrl,
          headers: req.headers,
          body: req.body,
        }),
      },
    });
  }

  next();
};

module.exports = { securityLogger };
