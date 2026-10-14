
import { z } from "zod";

const loginFields = {
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),

  password: z
    .string()
    .min(1, "Password is required"),
};

export const loginSchema = z.strictObject(loginFields);

export const loginRequestSchema = loginSchema;

export type LoginFormValues = z.infer<typeof loginSchema>;

export type LoginRequestValues = z.infer<
  typeof loginRequestSchema
>;
