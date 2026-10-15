
import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyEmailRequestSchema } from "@/features/auth/schemas/verify-email-schema";

const TIMEOUT_MS = 12_000;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

const upstreamSuccessSchema = z.object({
  code: z.literal("200"),
  message: z.literal("Email verified successfully"),
});

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      code: String(status),
      message,
    },
    {
      status,
      headers: NO_STORE_HEADERS,
    }
  );
}

export async function POST(request: Request) {
  // Reject requests from a different browser origin.
  const origin = request.headers.get("origin");

  if (origin && origin !== new URL(request.url).origin) {
    return errorResponse(
      "Forbidden request origin",
      403
    );
  }

  // The token must never be placed in query parameters.
  // It is accepted only through the JSON request body.
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      "Invalid JSON request body",
      400
    );
  }

  const validation =
    verifyEmailRequestSchema.safeParse(body);

  if (!validation.success) {
    return errorResponse(
      "Invalid verification token",
      400
    );
  }

  // Server-side environment variable only.
  const gatewayUrl = process.env.API_GATEWAY_URL;

  if (!gatewayUrl) {
    return errorResponse(
      "Verification service is not configured",
      503
    );
  }

  let endpoint: URL;

  try {
    endpoint = new URL(
      "/api/auth/verify-email",
      gatewayUrl
    );

    if (
      endpoint.protocol !== "http:" &&
      endpoint.protocol !== "https:"
    ) {
      return errorResponse(
        "Invalid verification service configuration",
        503
      );
    }
  } catch {
    return errorResponse(
      "Invalid verification service configuration",
      503
    );
  }

  try {
    // Forward only the validated body.
    // No cookies or Authorization headers.
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validation.data),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (upstream.status === 200) {
      const rawResponse: unknown =
        await upstream.json().catch(() => null);

      const parsed =
        upstreamSuccessSchema.safeParse(rawResponse);

      if (!parsed.success) {
        return errorResponse(
          "Invalid verification service response",
          502
        );
      }

      // Never return the verification token.
      // Email verification does not create a session.
      return NextResponse.json(
        {
          code: "200",
          message: "Email verified successfully",
        },
        {
          status: 200,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    // Backend intentionally uses one response for
    // expired, invalid, revoked, and reused tokens.
    if (upstream.status === 400) {
      return errorResponse(
        "Invalid or expired verification token",
        400
      );
    }

    if (upstream.status === 429) {
      return errorResponse(
        "Too many verification attempts. Please try again later.",
        429
      );
    }

    return errorResponse(
      "Verification service is temporarily unavailable",
      502
    );
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      (
        error.name === "TimeoutError" ||
        error.name === "AbortError"
      );

    return errorResponse(
      isTimeout
        ? "Verification request timed out"
        : "Unable to connect to verification service",
      isTimeout ? 504 : 503
    );
  }
}
