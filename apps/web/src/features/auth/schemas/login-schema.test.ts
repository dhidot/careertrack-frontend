
import { describe, expect, it } from "vitest";

import {
  loginSchema,
  loginRequestSchema,
} from "./login-schema";

const validPayload = {
  email: "user@example.com",
  password: "Password123",
};

describe("Login Schema", () => {
  it("accepts a valid login request", () => {
    expect(
      loginSchema.safeParse(validPayload).success
    ).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      ...validPayload,
      email: "invalid-email",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      ...validPayload,
      password: "",
    });

    expect(result.success).toBe(false);
  });

  it("normalizes email without changing password", () => {
    const result = loginSchema.parse({
      email: "  USER@EXAMPLE.COM  ",
      password: " MyPassword123 ",
    });

    expect(result.email).toBe("user@example.com");
    expect(result.password).toBe(" MyPassword123 ");
  });

  it("rejects extra role field", () => {
    const result = loginRequestSchema.safeParse({
      ...validPayload,
      role: "ADMIN",
    });

    expect(result.success).toBe(false);
  });
});
