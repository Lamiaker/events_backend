const { z } = require("zod");
const { PrismaClient } = require("@prisma/client");
const { hashPassword, comparePassword } = require("../utils/bcrypt.util");
const { generateToken } = require("../utils/jwt.util");
const prisma = new PrismaClient();
const { registerSchema, loginSchema } = require("../schemas/admin.schema");

const registerAdmin = async (req, res) => {
  try {
    // 1. Validation des données avec le schéma importé
    const validatedData = registerSchema.parse(req.body);

    // 2. Vérification de la clé secrète
    if (validatedData.secretKey !== process.env.ADMIN_REGISTRATION_KEY) {
      return res.status(403).json({
        success: false,
        error: "FORBIDDEN",
        message: "Clé d'inscription invalide",
      });
    }

    // 3. Vérification de l'unicité de l'email
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        error: "CONFLICT",
        message: "Un administrateur avec cet email existe déjà",
      });
    }

    // 4. Hashage du mot de passe
    const hashedPassword = await hashPassword(validatedData.password);

    // 5. Création de l'admin
    const admin = await prisma.admin.create({
      data: {
        firstName: validatedData.firstName.trim(),
        lastName: validatedData.lastName.trim(),
        email: validatedData.email.toLowerCase().trim(),
        password: hashedPassword,
      },
    });

    // 6. Génération du token
    const token = generateToken(admin.id, "ADMIN");

    // 7. Réponse
    res
      .status(201)
      .cookie("adminToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 86400000, // 1 jour
      })
      .json({
        success: true,
        data: {
          id: admin.id,
          firstName: admin.firstName,
          email: admin.email,
          createdAt: admin.createdAt,
        },
      });
  } catch (error) {
    // Gestion des erreurs Zod
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Erreur de validation des données",
        details: error.errors.map((err) => ({
          field: err.path[0],
          message: err.message,
          code: err.code,
        })),
      });
    }

    // Erreurs Prisma
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: "CONFLICT",
        message: "Un administrateur avec cet email existe déjà",
      });
    }

    // Erreur serveur inattendue
    console.error("[ADMIN_CONTROLLER]", error);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Une erreur interne est survenue",
    });
  }
};

const loginAdmin = async (req, res) => {
  try {
    // 1. Validation des données avec le schéma importé
    const { email, password } = loginSchema.parse(req.body);

    // 2. Recherche de l'admin
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    // 3. Vérification des identifiants
    if (!admin || !(await comparePassword(password, admin.password))) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Email ou mot de passe incorrect",
      });
    }

    // 4. Génération du token
    const token = generateToken(admin.id, "ADMIN");

    // 5. Réponse
    res
      .status(200)
      .cookie("adminToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 86400000, // 1 jour
      })
      .json({
        success: true,
        data: {
          id: admin.id,
          firstName: admin.firstName,
          email: admin.email,
        },
      });
  } catch (error) {
    // Gestion des erreurs Zod
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Erreur de validation des données",
        details: error.errors.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      });
    }

    // Erreur serveur inattendue
    console.error("[ADMIN_CONTROLLER]", error);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Une erreur interne est survenue",
    });
  }
};

module.exports = { registerAdmin, loginAdmin };
