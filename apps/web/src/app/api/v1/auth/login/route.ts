
import { NextResponse } from "next/server";
import { z } from "zod";

import { loginRequestSchema } from "@/features/auth/schemas/login-schema";

// ==========================================
// CONSTANTS
// ==========================================

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

const INVALID_CREDENTIALS_MESSAGE =
  "Invalid email or password. If you recently registered, please verify your email before signing in.";

// ==========================================
// BACKEND RESPONSE VALIDATION
// ==========================================

const loginResponseSchema = z.object({
  data: z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
  }),
});

// ==========================================
// RESPONSE HELPER
// ==========================================

function errorResponse(
  message: string,
  status: number
) {
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

// ==========================================
// POST /api/v1/auth/login
// ==========================================

export async function POST(request: Request) {
  // ========================================
  // 1. SAME-ORIGIN VALIDATION
  // ========================================

  const origin = request.headers.get("origin");

  if (
    origin &&
    origin !== new URL(request.url).origin
  ) {
    return errorResponse(
      "Forbidden request origin",
      403
    );
  }

  // ========================================
  // 2. PARSE REQUEST
  // ========================================

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      "Invalid JSON request body",
      400
    );
  }

  // ========================================
  // 3. VALIDATE REQUEST
  // ========================================

  const validation =
    loginRequestSchema.safeParse(body);

  if (!validation.success) {
    return errorResponse(
      "Invalid login data",
      400
    );
  }

  // ========================================
  // 4. API GATEWAY CONFIGURATION
  // ========================================

  const gatewayUrl =
    process.env.API_GATEWAY_URL;

  if (!gatewayUrl) {
    return errorResponse(
      "Authentication service is not configured",
      503
    );
  }

  let endpoint: URL;

  try {
    endpoint = new URL(
      "/api/auth/login",
      gatewayUrl
    );

    if (
      endpoint.protocol !== "http:" &&
      endpoint.protocol !== "https:"
    ) {
      return errorResponse(
        "Invalid authentication service configuration",
        503
      );
    }
  } catch {
    return errorResponse(
      "Invalid authentication service configuration",
      503
    );
  }

  // ========================================
  // 5. CALL API GATEWAY
  // ========================================

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validation.data),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(12_000),
    });

    // ======================================
    // 6. LOGIN SUCCESS
    // ======================================

    if (upstream.status === 200) {
      const rawResponse: unknown =
        await upstream.json().catch(() => null);

      const parsed =
        loginResponseSchema.safeParse(
          rawResponse
        );

      if (!parsed.success) {
        return errorResponse(
          "Invalid authentication service response",
          502
        );
      }

      const {
        accessToken,
        refreshToken,
      } = parsed.data.data;

      // Never expose tokens in browser JSON.
      const response = NextResponse.json(
        {
          code: "200",
          message: "Login success",
        },
        {
          status: 200,
          headers: NO_STORE_HEADERS,
        }
      );

      const cookieOptions = {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
      };

      response.cookies.set(
        "careertrack_access",
        accessToken,
        cookieOptions
      );

      response.cookies.set(
        "careertrack_refresh",
        refreshToken,
        cookieOptions
      );

      return response;
    }

    // ======================================
    // 7. INVALID CREDENTIALS /
    //    ACCOUNT NOT ACTIVE
    // ======================================

    if (upstream.status === 401) {
      // Both cases share one response to avoid
      // revealing account verification status.
      return errorResponse(
        INVALID_CREDENTIALS_MESSAGE,
        401
      );
    }

    // ======================================
    // 8. OTHER BACKEND ERRORS
    // ======================================

    if (upstream.status === 400) {
      return errorResponse(
        "Invalid login data",
        400
      );
    }

    if (upstream.status === 429) {
      return errorResponse(
        "Too many login attempts. Please try again later.",
        429
      );
    }

    return errorResponse(
      "Authentication service is temporarily unavailable",
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
        ? "Authentication request timed out"
        : "Unable to connect to authentication service",
      isTimeout ? 504 : 503
    );
  }
}
