// Server-side helpers shared by BFF auth routes that need
// to call the API Gateway with the user's HttpOnly cookies.
// Never import this module from client components.

import { isIP } from "node:net";

import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const ACCESS_COOKIE = "careertrack_access";
export const REFRESH_COOKIE = "careertrack_refresh";

export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

const UPSTREAM_TIMEOUT_MS = 12_000;
const MAX_TOKEN_LENGTH = 8192;
const JWT_PATTERN =
  /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

const refreshResponseSchema = z.object({
  code: z.literal("200"),
  data: z.object({
    accessToken: z.string().min(1).max(MAX_TOKEN_LENGTH),
    refreshToken: z.string().min(1).max(MAX_TOKEN_LENGTH),
  }),
});

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

// =====================================================
// REQUEST GUARDS
// =====================================================

/**
 * State-changing auth routes only accept same-origin
 * browser POSTs. Missing Origin is rejected too.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return origin === new URL(request.url).origin;
}

export function readSessionCookies(request: NextRequest): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  return {
    accessToken:
      access && JWT_PATTERN.test(access) ? access : null,
    refreshToken:
      refresh &&
      refresh.length <= MAX_TOKEN_LENGTH &&
      refresh.trim().length > 0
        ? refresh
        : null,
  };
}

const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/**
 * Expire both session cookies with the same attributes
 * used when they were set, so the browser drops them.
 */
export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_COOKIE, "", cookieOptions(0));
  response.cookies.set(REFRESH_COOKIE, "", cookieOptions(0));
}

/**
 * Store a freshly rotated pair. Needed when a route
 * rotated tokens but its main action then failed: the
 * browser's old refresh token is already revoked.
 */
export function setSessionCookies(
  response: NextResponse,
  tokens: TokenPair
): void {
  response.cookies.set(
    ACCESS_COOKIE,
    tokens.accessToken,
    cookieOptions(ACCESS_MAX_AGE)
  );
  response.cookies.set(
    REFRESH_COOKIE,
    tokens.refreshToken,
    cookieOptions(REFRESH_MAX_AGE)
  );
}

// =====================================================
// CLIENT IP FORWARDING (per-client rate limiting)
// =====================================================
//
// Every request reaches the gateway from Vercel's servers, so without
// this the gateway sees one shared IP for all users and rate limits
// everyone together. The BFF forwards the browser's IP, signed with a
// shared secret the gateway checks (GATEWAY_BFF_KEY on both sides).

export const CLIENT_IP_HEADER = "X-CareerTrack-Client-IP";
export const BFF_KEY_HEADER = "X-CareerTrack-BFF-Key";

/**
 * The browser's IP as seen by the platform in front of Next.js.
 * On Vercel, x-real-ip / x-forwarded-for are set by Vercel's edge and
 * cannot be forged by the client. Behind another proxy, make sure it
 * overwrites these headers before trusting them.
 */
export function clientIpOf(request: Request): string | null {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && isIP(realIp)) {
    return realIp;
  }

  const firstHop = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  if (firstHop && isIP(firstHop)) {
    return firstHop;
  }

  return null;
}

/**
 * Headers to add to gateway calls. Empty when the key is not
 * configured or the IP is unknown, in which case the gateway falls
 * back to the address it sees (shared Vercel IP).
 */
export function gatewayClientHeaders(
  request: Request
): Record<string, string> {
  const key = process.env.GATEWAY_BFF_KEY?.trim();
  const ip = clientIpOf(request);

  if (!key || !ip) {
    return {};
  }

  return {
    [CLIENT_IP_HEADER]: ip,
    [BFF_KEY_HEADER]: key,
  };
}

// =====================================================
// GATEWAY CALLS
// =====================================================

export function resolveGatewayEndpoint(path: string): URL | null {
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

    return new URL(path, baseUrl);
  } catch {
    return null;
  }
}

export function postToGateway(
  endpoint: URL,
  options: {
    accessToken?: string;
    body?: unknown;
    clientHeaders?: Record<string, string>;
  }
): Promise<Response> {
  const headers: Record<string, string> = {
    ...options.clientHeaders,
    Accept: "application/json",
  };

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(endpoint, {
    method: "POST",
    headers,
    body:
      options.body === undefined
        ? undefined
        : JSON.stringify(options.body),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
}

/**
 * Exchange a refresh token for a new pair. Used when the
 * access token has expired but the user still needs an
 * authenticated call (e.g. logout). Returns null when the
 * refresh token is rejected or the response is malformed.
 * Network errors propagate to the caller.
 */
export async function rotateTokens(
  refreshToken: string,
  clientHeaders: Record<string, string> = {}
): Promise<TokenPair | null> {
  const endpoint = resolveGatewayEndpoint("/api/auth/refresh");

  if (!endpoint) {
    return null;
  }

  const upstream = await postToGateway(endpoint, {
    body: { refreshToken },
    clientHeaders,
  });

  if (upstream.status !== 200) {
    return null;
  }

  const raw: unknown = await upstream.json().catch(() => null);
  const parsed = refreshResponseSchema.safeParse(raw);

  return parsed.success ? parsed.data.data : null;
}

export function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}
