
import { z } from "zod";

/**
 * Verification tokens are generated from
 * 32 random bytes encoded as unpadded Base64URL.
 *
 * Expected length: 43 characters.
 */
export const verifyEmailRequestSchema = z.strictObject({
  token: z
    .string()
    .regex(
      /^[A-Za-z0-9_-]{43}$/,
      "Invalid verification token"
    ),
});

export type VerifyEmailRequestValues = z.infer<
  typeof verifyEmailRequestSchema
>;
