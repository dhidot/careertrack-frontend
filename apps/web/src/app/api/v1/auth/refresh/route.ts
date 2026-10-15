
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// =====================================================
// CONSTANTS
// =====================================================

const ACCESS_COOKIE = "careertrack_access";
const REFRESH_COOKIE = "careertrack_refresh";

const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

// =====================================================
// BACKEND RESPONSE CONTRACT
// =====================================================

const refreshResponseSchema = z.object({
  code: z.literal("200"),
  data: z.object({
    accessToken: z.string().min(1).max(8192),
    refreshToken: z.string().min(1).max(8192),
  }),
});

// =====================================================
// HELPERS
// =====================================================

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

function getRefreshEndpoint(): URL | null {
  const gatewayUrl = process.env.API_GATEWAY_URL;

  if (!gatewayUrl) {
    return null;
  }

  try {
    const baseUrl = new URL(gatewayUrl);

    if (
      baseUrl.protocol !== "http:" &&
      baseUrl.protocol !== "https:"
    ) {
      return null;
    }

    if (
      baseUrl.username ||
      baseUrl.password ||
      baseUrl.search ||
      baseUrl.hash
    ) {
      return null;
    }

    return new URL("/api/auth/refresh", baseUrl);
  } catch {
    return null;
  }
}

// =====================================================
// POST /api/v1/auth/refresh
// =====================================================

export async function POST(request: NextRequest) {
  // -------------------------------------------------
  // 1. CSRF / SAME-ORIGIN VALIDATION
  // -------------------------------------------------

  const origin = request.headers.get("origin");
  const expectedOrigin = new URL(request.url).origin;

  // Refresh is initiated through same-origin browser POST.
  // Missing and cross-origin Origin headers are rejected.
  if (origin !== expectedOrigin) {
    return errorResponse("Forbidden request origin", 403);
  }

  // -------------------------------------------------
  // 2. READ HTTPONLY REFRESH COOKIE
  // -------------------------------------------------

  const refreshToken = request.cookies.get(
    REFRESH_COOKIE
  )?.value;

  if (!refreshToken) {
    return errorResponse("Session expired", 401);
  }

    if (
    refreshToken.length > 8192 ||
    refreshToken.trim().length === 0
    ) {
    return errorResponse("Invalid session", 401);
    }

  // -------------------------------------------------
  // 3. RESOLVE API GATEWAY
  // -------------------------------------------------

  const endpoint = getRefreshEndpoint();

  if (!endpoint) {
    return errorResponse(
      "Authentication service is not configured",
      503
    );
  }

  try {
    // -------------------------------------------------
    // 4. CALL AUTH SERVICE
    // -------------------------------------------------

    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        refreshToken,
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(12_000),
    });

    // -------------------------------------------------
    // 5. REJECTED REFRESH TOKEN
    // -------------------------------------------------

    if (
      upstream.status === 400 ||
      upstream.status === 401
    ) {
      // Do not clear cookies here.
      // A concurrent successful refresh might have
      // already issued newer cookies to the browser.
      return errorResponse("Session expired", 401);
    }

    if (upstream.status === 403) {
      return errorResponse("Forbidden", 403);
    }

    if (upstream.status === 429) {
      return errorResponse(
        "Too many requests. Please try again later.",
        429
      );
    }

    if (upstream.status !== 200) {
      return errorResponse(
        "Authentication service is temporarily unavailable",
        502
      );
    }

    // -------------------------------------------------
    // 6. VALIDATE BACKEND RESPONSE
    // -------------------------------------------------

    const rawResponse: unknown = await upstream
      .json()
      .catch(() => null);

    const parsed = refreshResponseSchema.safeParse(
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
      refreshToken: newRefreshToken,
    } = parsed.data.data;

    // -------------------------------------------------
    // 7. CREATE SAFE BROWSER RESPONSE
    // -------------------------------------------------

    const response = NextResponse.json(
      {
        code: "200",
        message: "Session refreshed successfully",
      },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    // -------------------------------------------------
    // 8. ROTATE BOTH COOKIES
    // -------------------------------------------------

    response.cookies.set(
      ACCESS_COOKIE,
      accessToken,
      {
        ...cookieOptions,
        maxAge: ACCESS_MAX_AGE,
      }
    );

    response.cookies.set(
      REFRESH_COOKIE,
      newRefreshToken,
      {
        ...cookieOptions,
        maxAge: REFRESH_MAX_AGE,
      }
    );

    return response;
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      (error.name === "TimeoutError" ||
        error.name === "AbortError");

    return errorResponse(
      isTimeout
        ? "Authentication request timed out"
        : "Unable to connect to authentication service",
      isTimeout ? 504 : 503
    );
  }
}
