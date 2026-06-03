import { z } from "zod";

export const addUserSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "Full name must be at least 3 characters")
      .max(100, "Full name must be at most 100 characters"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),
    email: z
      .email("Please enter a valid email address")
      .min(1, "Email is required"),
    role: z.enum(["worker", "supervisor"], "Please select a valid role"),
    division: z.string().min(1, "Division is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .optional(),
    confirmPassword: z.string().min(1, "Please confirm your password").optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AddUserSchema = z.infer<typeof addUserSchema>;
