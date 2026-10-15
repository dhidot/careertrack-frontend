
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ACCESS_COOKIE = "careertrack_access";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

const meResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  data: z.object({
    id: z.string().uuid(),
    username: z.string(),
    email: z.string(),
    roles: z.array(z.enum(["USER", "ADMIN"])),
    permissions: z.array(z.string()),
  }),
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

function getGatewayEndpoint(): URL | null {
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

    return new URL("/api/auth/me", baseUrl);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  // 1. Read server-side HttpOnly cookie.
  const accessToken = request.cookies.get(
    ACCESS_COOKIE
  )?.value;

  if (!accessToken) {
    return errorResponse("Unauthorized", 401);
  }

  // Only standard compact JWTs are forwarded.
  const jwtPattern =
    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

  if (!jwtPattern.test(accessToken)) {
    return errorResponse("Unauthorized", 401);
  }

  // 2. Resolve API Gateway.
  const endpoint = getGatewayEndpoint();

  if (!endpoint) {
    return errorResponse(
      "Authentication service is not configured",
      503
    );
  }

  try {
    // 3. Delegate authentication to Auth Service.
    const upstream = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(12_000),
    });

    // 4. Invalid or expired access token.
    if (upstream.status === 401) {
      return errorResponse("Unauthorized", 401);
    }

    if (upstream.status === 403) {
      return errorResponse("Forbidden", 403);
    }

    if (upstream.status !== 200) {
      return errorResponse(
        "Authentication service is temporarily unavailable",
        502
      );
    }

    // 5. Validate backend response contract.
    const rawResponse: unknown = await upstream
      .json()
      .catch(() => null);

    const parsed = meResponseSchema.safeParse(
      rawResponse
    );

    if (!parsed.success) {
      return errorResponse(
        "Invalid authentication service response",
        502
      );
    }

    const { data } = parsed.data;

    // 6. CareerTrack Web is exclusive to USER.
    // ADMIN must use the separate CMS frontend.
    if (
      data.roles.length !== 1 ||
      data.roles[0] !== "USER"
    ) {
      return errorResponse(
        "Access denied for this application",
        403
      );
    }

    // 7. Return user identity, never tokens.
    return NextResponse.json(
      {
        code: "200",
        message: "Success",
        data,
      },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      }
    );
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
