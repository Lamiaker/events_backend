const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Vérifie si le mot de passe a été compromis
const isPasswordCompromised = async (password) => {
  // Implémentez une vérification contre une API comme HaveIBeenPwned
  // ou une liste locale de mots de passe courants
  return false;
};

const hashPassword = async (password) => {
  if (await isPasswordCompromised(password)) {
    throw new Error("This password has been compromised");
  }

  const salt = await bcrypt.genSalt(12); // Augmentez le coût
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (candidatePassword, hashedPassword) => {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

// Vérifie la force du mot de passe
const passwordStrength = (password) => {
  const strongRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{12,})/;
  return strongRegex.test(password);
};

module.exports = { hashPassword, comparePassword, passwordStrength };
