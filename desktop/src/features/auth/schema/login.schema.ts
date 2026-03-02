import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, "Identifier terlalu pendek")
    .max(100, "Identifier terlalu panjang")
    .refine((val) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const usernameRegex = /^[a-zA-Z0-9._]+$/;
      return emailRegex.test(val) || usernameRegex.test(val);
    }, "Harus berupa email atau username yang valid"),

  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(100, "Password terlalu panjang"),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;
