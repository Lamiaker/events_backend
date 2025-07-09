const { z } = require("zod");

const registerSchema = z
  .object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(8).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/),
    confirmPassword: z.string(),
    phone: z
      .string()
      .regex(/^[0-9]+$/)
      .optional(),
    wilaya: z.string().optional(),
    role: z.enum(["USER", "PROVIDER"]),
    businessName: z.string().optional(),
    address: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.role === "PROVIDER") {
        return data.businessName && data.address;
      }
      return true;
    },
    {
      message: "Providers must provide business name and address",
      path: ["businessName", "address"],
    }
  );

module.exports = { registerSchema };
