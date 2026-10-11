
import { z } from "zod";

const registerFields = {
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
      "Please enter a valid email address"
    ),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
      "Password must contain uppercase, lowercase, and a number"
    ),
};

// Payload accepted by the Next.js BFF.
// No confirmPassword or role field.
export const registerRequestSchema = z.strictObject(
  registerFields
);

// Frontend form validation.
export const registerSchema = z
  .strictObject({
    ...registerFields,

    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

export type RegisterRequestValues = z.infer<
  typeof registerRequestSchema
>;

export type RegisterFormValues = z.infer<
  typeof registerSchema
>;
