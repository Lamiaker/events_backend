const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  // Vérification des opérations sensibles
  if (params.action === "delete" || params.action === "deleteMany") {
    console.warn(`Warning: Delete operation on ${params.model}`);
  }

  // Limitation des requêtes
  if (params.action === "findMany" && !params.args.take) {
    params.args.take = 100; // Limite par défaut
  }

  return next(params);
});

module.exports = prisma;
