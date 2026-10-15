
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { NextRequest } from "next/server";
import { POST } from "./route";

const fetchMock = vi.fn<typeof fetch>();

const OLD_REFRESH = "opaque-refresh-token-example-123";
const NEW_ACCESS = "new.access.signature";
const NEW_REFRESH = "new.refresh.signature";

const BASE_URL =
  "http://localhost:3000/api/v1/auth/refresh";

function makeRequest(
  token?: string,
  origin: string | null = "http://localhost:3000"
): NextRequest {
  const headers: Record<string, string> = {};

  if (origin !== null) {
    headers.Origin = origin;
  }

  if (token !== undefined) {
    headers.Cookie = `careertrack_refresh=${token}`;
  }

  return new NextRequest(BASE_URL, {
    method: "POST",
    headers,
  });
}

function backendResponse(
  status: number,
  body: unknown
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function successfulRefresh(): Response {
  return backendResponse(200, {
    code: "200",
    message: "Token refreshed successfully",
    data: {
      accessToken: NEW_ACCESS,
      refreshToken: NEW_REFRESH,
    },
  });
}

describe("POST /api/v1/auth/refresh", () => {
  beforeEach(() => {
    fetchMock.mockReset();

    vi.stubGlobal("fetch", fetchMock);

    vi.stubEnv(
      "API_GATEWAY_URL",
      "http://127.0.0.1:8080"
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  // =================================================
  // 1. SUCCESSFUL TOKEN ROTATION
  // =================================================

  it("rotates both HttpOnly cookies without exposing tokens", async () => {
    fetchMock.mockResolvedValueOnce(
      successfulRefresh()
    );

    const response = await POST(
      makeRequest(OLD_REFRESH)
    );

    expect(response.status).toBe(200);

    const responseBody = await response.json();

    expect(responseBody).toEqual({
    code: "200",
    message: "Session refreshed successfully",
    });

    expect(response.cookies.get(
      "careertrack_access"
    )).toMatchObject({
      value: NEW_ACCESS,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 900,
    });

    expect(response.cookies.get(
      "careertrack_refresh"
    )).toMatchObject({
      value: NEW_REFRESH,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });

    expect(response.headers.get(
      "Cache-Control"
    )).toBe("no-store");

    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, options] = fetchMock.mock.calls[0];

    expect(String(url)).toBe(
      "http://127.0.0.1:8080/api/auth/refresh"
    );

    expect(options?.method).toBe("POST");
    expect(options?.cache).toBe("no-store");
    expect(options?.redirect).toBe("error");

    expect(JSON.parse(
      String(options?.body)
    )).toEqual({
      refreshToken: OLD_REFRESH,
    });

    expect(JSON.stringify(responseBody))
    .not.toContain(NEW_ACCESS);

    expect(JSON.stringify(responseBody))
    .not.toContain(NEW_REFRESH);
  });

  // =================================================
  // 2. MISSING ORIGIN
  // =================================================

  it("rejects requests without Origin", async () => {
    const response = await POST(
      makeRequest(OLD_REFRESH, null)
    );

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // =================================================
  // 3. CROSS-ORIGIN REQUEST
  // =================================================

  it("rejects cross-origin requests", async () => {
    const response = await POST(
      makeRequest(
        OLD_REFRESH,
        "https://malicious.example"
      )
    );

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // =================================================
  // 4. MISSING REFRESH COOKIE
  // =================================================

  it("returns 401 when refresh cookie is missing", async () => {
    const response = await POST(
      makeRequest()
    );

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // =================================================
  // 5. MALFORMED REFRESH TOKEN
  // =================================================

    it("rejects excessively long refresh token", async () => {
    const response = await POST(
        makeRequest("x".repeat(8193))
    );

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    });

  // =================================================
  // 6. MISSING GATEWAY CONFIGURATION
  // =================================================

  it("returns 503 when gateway is not configured", async () => {
    vi.stubEnv("API_GATEWAY_URL", "");

    const response = await POST(
      makeRequest(OLD_REFRESH)
    );

    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // =================================================
  // 7. BACKEND REJECTS REFRESH TOKEN
  // =================================================

  it("returns 401 without clearing cookies when backend returns 401", async () => {
    fetchMock.mockResolvedValueOnce(
      backendResponse(401, {
        code: "401",
        message: "Invalid refresh token",
      })
    );

    const response = await POST(
      makeRequest(OLD_REFRESH)
    );

    expect(response.status).toBe(401);

    // Failed concurrent refresh must not erase
    // cookies that another response has rotated.
    expect(response.headers.get("set-cookie"))
      .toBeNull();
  });

  // =================================================
  // 8. BACKEND VALIDATION ERROR
  // =================================================

  it("maps backend 400 to session expired", async () => {
    fetchMock.mockResolvedValueOnce(
      backendResponse(400, {
        code: "400",
        message: "Invalid request",
      })
    );

    const response = await POST(
      makeRequest(OLD_REFRESH)
    );

    expect(response.status).toBe(401);
  });

  // =================================================
  // 9. RATE LIMITING
  // =================================================

  it("preserves backend 429 status", async () => {
    fetchMock.mockResolvedValueOnce(
      backendResponse(429, {
        code: "429",
        message: "Too many requests",
      })
    );

    const response = await POST(
      makeRequest(OLD_REFRESH)
    );

    expect(response.status).toBe(429);
  });

  // =================================================
  // 10. UPSTREAM SERVER ERROR
  // =================================================

  it("returns 502 when backend fails", async () => {
    fetchMock.mockResolvedValueOnce(
      backendResponse(500, {
        message: "Internal server error",
      })
    );

    const response = await POST(
      makeRequest(OLD_REFRESH)
    );

    expect(response.status).toBe(502);
    expect(response.headers.get("set-cookie"))
      .toBeNull();
  });

  // =================================================
  // 11. INVALID SUCCESS RESPONSE
  // =================================================

  it("rejects incomplete backend success response", async () => {
    fetchMock.mockResolvedValueOnce(
      backendResponse(200, {
        code: "200",
        data: {
          accessToken: NEW_ACCESS,
          // refreshToken missing
        },
      })
    );

    const response = await POST(
      makeRequest(OLD_REFRESH)
    );

    expect(response.status).toBe(502);

    expect(response.cookies.get(
      "careertrack_access"
    )).toBeUndefined();

    expect(response.cookies.get(
      "careertrack_refresh"
    )).toBeUndefined();
  });

  // =================================================
  // 12. NETWORK FAILURE
  // =================================================

  it("returns 503 when gateway is unreachable", async () => {
    fetchMock.mockRejectedValueOnce(
      new Error("Connection refused")
    );

    const response = await POST(
      makeRequest(OLD_REFRESH)
    );

    expect(response.status).toBe(503);
  });

  // =================================================
  // 13. REQUEST TIMEOUT
  // =================================================

  it("returns 504 on timeout", async () => {
    const timeoutError = new Error(
      "Request timeout"
    );

    timeoutError.name = "TimeoutError";

    fetchMock.mockRejectedValueOnce(
      timeoutError
    );

    const response = await POST(
      makeRequest(OLD_REFRESH)
    );

    expect(response.status).toBe(504);
  });

  it("rejects excessively long refresh token", async () => {
    const response = await POST(
        makeRequest("x".repeat(8193))
    );

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    });

    it("accepts opaque refresh token and forwards it to backend", async () => {
    const opaqueToken = "opaque-refresh-token-123456";

    fetchMock.mockResolvedValueOnce(
        successfulRefresh()
    );

    const response = await POST(
        makeRequest(opaqueToken)
    );

    expect(response.status).toBe(200);

    const [, options] = fetchMock.mock.calls[0];

    expect(JSON.parse(String(options?.body))).toEqual({
        refreshToken: opaqueToken,
    });
    });
});
