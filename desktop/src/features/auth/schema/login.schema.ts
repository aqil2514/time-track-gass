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
    .max(100, "Password terlalu panjang")
    .regex(/[A-Z]/, "Password harus memiliki huruf kapital")
    .regex(/[a-z]/, "Password harus memiliki huruf kecil")
    .regex(/[0-9]/, "Password harus memiliki angka")
    .regex(/[^A-Za-z0-9]/, "Password harus memiliki karakter khusus")
});

export type LoginSchemaType = z.infer<typeof loginSchema>;