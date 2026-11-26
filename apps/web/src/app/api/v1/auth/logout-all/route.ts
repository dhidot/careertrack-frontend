import { NextRequest, NextResponse } from "next/server";

import {
  NO_STORE_HEADERS,
  clearSessionCookies,
  isSameOrigin,
  isTimeoutError,
  postToGateway,
  readSessionCookies,
  resolveGatewayEndpoint,
  rotateTokens,
  setSessionCookies,
  type TokenPair,
} from "@/features/auth/lib/auth-upstream";

// =====================================================
// POST /api/v1/auth/logout-all
// =====================================================
//
// Revokes every session of the user on every device.
//
// Unlike /logout this is NOT fail-open: if Auth Service
// cannot confirm the revocation, the user stays logged in
// here and gets an error, because silently logging out
// only this browser would falsely suggest other devices
// were signed out too.

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { code: String(status), message },
    { status, headers: NO_STORE_HEADERS }
  );
}

function sessionEnded() {
  const response = errorResponse("Session expired", 401);
  clearSessionCookies(response);
  return response;
}

function mapUpstreamFailure(status: number) {
  if (status === 403) {
    return errorResponse("Forbidden", 403);
  }

  if (status === 429) {
    return errorResponse(
      "Too many requests. Please try again later.",
      429
    );
  }

  return errorResponse(
    "Authentication service is temporarily unavailable",
    502
  );
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return errorResponse("Forbidden request origin", 403);
  }

  const { accessToken, refreshToken } = readSessionCookies(request);

  if (!accessToken && !refreshToken) {
    return sessionEnded();
  }

  const endpoint = resolveGatewayEndpoint("/api/auth/logout-all");

  if (!endpoint) {
    return errorResponse(
      "Authentication service is not configured",
      503
    );
  }

  let rotated: TokenPair | null = null;

  // If tokens were rotated, the browser's old refresh
  // token is already revoked. Any error response must
  // carry the new pair or the user gets logged out.
  const keepRotated = (response: NextResponse) => {
    if (rotated) {
      setSessionCookies(response, rotated);
    }
    return response;
  };

  try {
    let upstreamStatus = 401;

    if (accessToken) {
      const upstream = await postToGateway(endpoint, { accessToken });
      upstreamStatus = upstream.status;
    }

    // Access token missing/expired: rotate once and retry.
    if (upstreamStatus === 401) {
      if (!refreshToken) {
        return sessionEnded();
      }

      rotated = await rotateTokens(refreshToken);

      if (!rotated) {
        return sessionEnded();
      }

      const retry = await postToGateway(endpoint, {
        accessToken: rotated.accessToken,
      });
      upstreamStatus = retry.status;

      if (upstreamStatus === 401) {
        return sessionEnded();
      }
    }

    if (upstreamStatus !== 200) {
      return keepRotated(mapUpstreamFailure(upstreamStatus));
    }

    const response = NextResponse.json(
      { code: "200", message: "All sessions revoked" },
      { status: 200, headers: NO_STORE_HEADERS }
    );

    clearSessionCookies(response);

    return response;
  } catch (error) {
    return keepRotated(
      isTimeoutError(error)
        ? errorResponse("Authentication request timed out", 504)
        : errorResponse(
            "Unable to connect to authentication service",
            503
          )
    );
  }
}
