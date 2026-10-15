
"use client";

import { z } from "zod";

// =====================================================
// CONTRACT
// =====================================================

const meResponseSchema = z.object({
  code: z.literal("200"),
  data: z.object({
    id: z.string().uuid(),
    username: z.string(),
    email: z.string(),
    roles: z.array(z.enum(["USER", "ADMIN"])),
    permissions: z.array(z.string()),
  }),
});

export type SessionUser =
  z.infer<typeof meResponseSchema>["data"];

export type SessionResult =
  | {
      status: "authenticated";
      user: SessionUser;
    }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "unavailable" };

// =====================================================
// READ SESSION FROM BFF
// =====================================================

async function requestMe(): Promise<SessionResult> {
  try {
    const response = await fetch("/api/v1/auth/me", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });

    if (response.status === 401) {
      return { status: "unauthenticated" };
    }

    if (response.status === 403) {
      return { status: "forbidden" };
    }

    if (response.status !== 200) {
      return { status: "unavailable" };
    }

    const raw: unknown = await response
      .json()
      .catch(() => null);

    const parsed = meResponseSchema.safeParse(raw);

    if (!parsed.success) {
      return { status: "unavailable" };
    }

    const user = parsed.data.data;

    // Defense in depth. Web application only
    // accepts a USER identity.
    if (
      user.roles.length !== 1 ||
      user.roles[0] !== "USER"
    ) {
      return { status: "forbidden" };
    }

    return {
      status: "authenticated",
      user,
    };
  } catch {
    return { status: "unavailable" };
  }
}

// =====================================================
// REFRESH SESSION THROUGH BFF
// =====================================================

async function requestRefresh(): Promise<
  "success" | "unauthenticated" | "unavailable"
> {
  try {
    const response = await fetch(
      "/api/v1/auth/refresh",
      {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      }
    );

    if (response.status === 200) {
      return "success";
    }

    if (response.status === 401) {
      return "unauthenticated";
    }

    return "unavailable";
  } catch {
    return "unavailable";
  }
}

// =====================================================
// SESSION RESOLUTION
// =====================================================

async function resolveSession(): Promise<SessionResult> {
  // Step 1: Validate existing access token.
  const initial = await requestMe();

  if (initial.status !== "unauthenticated") {
    return initial;
  }

  // Step 2: Access token invalid / expired.
  const refresh = await requestRefresh();

  if (refresh === "unauthenticated") {
    return { status: "unauthenticated" };
  }

  if (refresh === "unavailable") {
    return { status: "unavailable" };
  }

  // Step 3: Retry /me exactly once.
  // No recursion, no infinite retry.
  return requestMe();
}

// =====================================================
// SINGLE-FLIGHT SESSION COORDINATOR
// =====================================================

let pendingSession:
  | Promise<SessionResult>
  | null = null;

/**
 * Multiple callers in the same browser module instance
 * share a single session-resolution request.
 *
 * Does not synchronize multiple browser tabs or
 * multiple devices.
 */
export function getSession(): Promise<SessionResult> {
  if (pendingSession) {
    return pendingSession;
  }

  const request = resolveSession();

  pendingSession = request;

  const clearPending = () => {
    if (pendingSession === request) {
      pendingSession = null;
    }
  };

  void request.then(clearPending, clearPending);

  return request;
}
