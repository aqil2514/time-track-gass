import { z } from "zod";

const identifierSchema = z
  .string()
  .min(3, "Identifier is too short")
  .max(100, "Identifier is too long")
  .refine((val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    return emailRegex.test(val) || usernameRegex.test(val);
  }, "Must be a valid email or username");

const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const checkResetPasswordSchema = z.object({
  identifier: identifierSchema,
});

export const setResetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type CheckResetPasswordValues = z.infer<typeof checkResetPasswordSchema>;
export type SetResetPasswordValues = z.infer<typeof setResetPasswordSchema>;
