const { z } = require("zod");

const registerSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: "Le prénom doit contenir au moins 2 caractères" })
    .max(50),

  lastName: z
    .string()
    .min(2, { message: "Le nom doit contenir au moins 2 caractères" })
    .max(50),

  email: z
    .string()
    .email({ message: "Email invalide" })
    .transform((val) => val.toLowerCase()),

  password: z
    .string()
    .min(8, { message: "8 caractères minimum" })
    .regex(/[A-Z]/, { message: "Au moins une majuscule" })
    .regex(/[0-9]/, { message: "Au moins un chiffre" })
    .regex(/[^a-zA-Z0-9]/, { message: "Au moins un caractère spécial" }),

  secretKey: z.string().min(16, { message: "Clé secrète invalide" }),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

module.exports = {
  registerSchema,
  loginSchema,
};
