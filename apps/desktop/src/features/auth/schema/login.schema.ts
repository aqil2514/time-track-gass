import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, "Identifier is too short")
    .max(100, "Identifier is too long")
    .refine((val) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const usernameRegex = /^[a-zA-Z0-9._]+$/;
      return emailRegex.test(val) || usernameRegex.test(val);
    }, "Must be a valid email or username"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;
