import { NextRequest, NextResponse } from "next/server";

import {
  NO_STORE_HEADERS,
  clearSessionCookies,
  isSameOrigin,
  postToGateway,
  readSessionCookies,
  resolveGatewayEndpoint,
  rotateTokens,
} from "@/features/auth/lib/auth-upstream";

// =====================================================
// POST /api/v1/auth/logout
// =====================================================
//
// Ends the current browser session.
//
// Local logout is guaranteed: cookies are always cleared,
// even when Auth Service is down. Server-side revocation
// of the refresh token is best effort and reported back
// as `sessionRevoked` so it is observable in tests/logs.

async function revokeOnServer(
  accessToken: string | null,
  refreshToken: string
): Promise<boolean> {
  const endpoint = resolveGatewayEndpoint("/api/auth/logout");

  if (!endpoint) {
    return false;
  }

  try {
    // 1. Normal path: valid access token + refresh token.
    if (accessToken) {
      const upstream = await postToGateway(endpoint, {
        accessToken,
        body: { refreshToken },
      });

      if (upstream.status === 200) {
        return true;
      }

      if (upstream.status !== 401) {
        return false;
      }
    }

    // 2. Access token missing/expired (Auth needs it to
    // authenticate the logout). Rotate once, then revoke
    // the freshly issued refresh token. The old one was
    // already revoked by the rotation itself.
    const rotated = await rotateTokens(refreshToken);

    if (!rotated) {
      // Refresh token already invalid: nothing left to
      // revoke on the server.
      return false;
    }

    const retry = await postToGateway(endpoint, {
      accessToken: rotated.accessToken,
      body: { refreshToken: rotated.refreshToken },
    });

    return retry.status === 200;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { code: "403", message: "Forbidden request origin" },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const { accessToken, refreshToken } = readSessionCookies(request);

  const sessionRevoked = refreshToken
    ? await revokeOnServer(accessToken, refreshToken)
    : false;

  const response = NextResponse.json(
    {
      code: "200",
      message: "Logged out",
      data: { sessionRevoked },
    },
    { status: 200, headers: NO_STORE_HEADERS }
  );

  clearSessionCookies(response);

  return response;
}
