
import { describe, expect, it } from "vitest";

import {
  registerSchema,
  registerRequestSchema,
} from "./register-schema";

const validRequest = {
  username: "careertrackuser",
  email: "careertrack@example.com",
  password: "Password123",
};

const validForm = {
  ...validRequest,
  confirmPassword: "Password123",
};

describe("Register Schema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse(validForm);

    expect(result.success).toBe(true);
  });

  it("rejects username shorter than 3 characters", () => {
    const result = registerSchema.safeParse({
      ...validForm,
      username: "ab",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid email address", () => {
    const result = registerSchema.safeParse({
      ...validForm,
      email: "invalid-email",
    });

    expect(result.success).toBe(false);
  });

  it("requires uppercase, lowercase and number", () => {
    const result = registerSchema.safeParse({
      ...validForm,
      password: "password",
      confirmPassword: "password",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.path[0] === "password"
        )
      ).toBe(true);
    }
  });

  it("rejects password longer than 100 characters", () => {
    const longPassword = "Aa1" + "a".repeat(98);

    const result = registerSchema.safeParse({
      ...validForm,
      password: longPassword,
      confirmPassword: longPassword,
    });

    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...validForm,
      confirmPassword: "Different123",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.path[0] === "confirmPassword"
        )
      ).toBe(true);
    }
  });

  it("normalizes username and email", () => {
    const result = registerSchema.safeParse({
      ...validForm,
      username: "  careertrackuser  ",
      email: "  CAREERTRACK@EXAMPLE.COM  ",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.username).toBe("careertrackuser");
      expect(result.data.email).toBe("careertrack@example.com");
    }
  });

  it("rejects role injection in BFF registration payload", () => {
    const result = registerRequestSchema.safeParse({
      ...validRequest,
      role: "ADMIN",
    });

    expect(result.success).toBe(false);
  });

  it("accepts backend registration request without extra fields", () => {
    const result = registerRequestSchema.safeParse(validRequest);

    expect(result.success).toBe(true);
  });
});
