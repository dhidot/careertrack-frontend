
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { POST } from "./route";

// ==========================================
// MOCK FETCH
// ==========================================

const fetchMock = vi.fn<typeof fetch>();

// ==========================================
// TEST DATA
// ==========================================

const validPayload = {
  email: "user@example.com",
  password: "Password123",
};

const INVALID_CREDENTIALS_MESSAGE =
  "Invalid email or password. If you recently registered, please verify your email before signing in.";

// ==========================================
// TEST HELPERS
// ==========================================

function makeRequest(
  body: unknown,
  origin?: string
): Request {
  return new Request(
    "http://localhost:3000/api/v1/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(origin ? { Origin: origin } : {}),
      },
      body: JSON.stringify(body),
    }
  );
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

// ==========================================
// POST /api/v1/auth/login
// ==========================================

describe("POST /api/v1/auth/login", () => {
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

  // ========================================
  // 1. LOGIN SUCCESS
  // ========================================

  it("forwards credentials and stores tokens in HttpOnly cookies", async () => {
    fetchMock.mockResolvedValue(
      backendResponse(200, {
        code: "200",
        message: "Login success",
        data: {
          accessToken: "test-access-token",
          refreshToken: "test-refresh-token",
        },
      })
    );

    const response = await POST(
      makeRequest(validPayload)
    );

    expect(response.status).toBe(200);

    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, options] = fetchMock.mock.calls[0];

    expect(url.toString()).toBe(
      "http://127.0.0.1:8080/api/auth/login"
    );

    expect(options?.method).toBe("POST");

    expect(
      JSON.parse(String(options?.body))
    ).toEqual(validPayload);

    // ======================================
    // Browser response must not expose JWTs.
    // ======================================

    const result = await response.json();

    expect(result).toEqual({
      code: "200",
      message: "Login success",
    });

    expect(result).not.toHaveProperty(
      "accessToken"
    );

    expect(result).not.toHaveProperty(
      "refreshToken"
    );

    // ======================================
    // Access Token Cookie
    // ======================================

    expect(
      response.cookies.get("careertrack_access")
    ).toMatchObject({
      value: "test-access-token",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    // ======================================
    // Refresh Token Cookie
    // ======================================

    expect(
      response.cookies.get("careertrack_refresh")
    ).toMatchObject({
      value: "test-refresh-token",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    expect(
      response.headers.get("Cache-Control")
    ).toBe("no-store");
  });

  // ========================================
  // 2. REQUEST VALIDATION
  // ========================================

  it("rejects invalid login payload", async () => {
    const response = await POST(
      makeRequest({
        email: "invalid",
        password: "",
      })
    );

    expect(response.status).toBe(400);

    expect(await response.json()).toEqual({
      code: "400",
      message: "Invalid login data",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  // ========================================
  // 3. MALFORMED JSON
  // ========================================

  it("rejects malformed JSON request", async () => {
    const request = new Request(
      "http://localhost:3000/api/v1/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{invalid-json",
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(400);

    expect(await response.json()).toEqual({
      code: "400",
      message: "Invalid JSON request body",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  // ========================================
  // 4. ROLE INJECTION PROTECTION
  // ========================================

  it("rejects role injection", async () => {
    const response = await POST(
      makeRequest({
        ...validPayload,
        role: "ADMIN",
      })
    );

    expect(response.status).toBe(400);

    expect(fetchMock).not.toHaveBeenCalled();

    expect(
      response.cookies.get("careertrack_access")
    ).toBeUndefined();

    expect(
      response.cookies.get("careertrack_refresh")
    ).toBeUndefined();
  });

  // ========================================
  // 5. CROSS-ORIGIN REQUEST PROTECTION
  // ========================================

  it("rejects cross-origin login request", async () => {
    const response = await POST(
      makeRequest(
        validPayload,
        "https://another-site.example"
      )
    );

    expect(response.status).toBe(403);

    expect(await response.json()).toEqual({
      code: "403",
      message: "Forbidden request origin",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  // ========================================
  // 6. SAME-ORIGIN REQUEST
  // ========================================

  it("accepts same-origin login request", async () => {
    fetchMock.mockResolvedValue(
      backendResponse(401, {
        code: "401",
        message: "Invalid email or password",
        data: null,
      })
    );

    const response = await POST(
      makeRequest(
        validPayload,
        "http://localhost:3000"
      )
    );

    // The request passes origin validation and
    // reaches the mocked backend.
    expect(fetchMock).toHaveBeenCalledOnce();

    // HTTP 401 is returned by the backend.
    expect(response.status).toBe(401);
  });

  // ========================================
  // 7. INVALID CREDENTIALS /
  //    ACCOUNT NOT VERIFIED
  // ========================================

  it("returns generic verification guidance for HTTP 401 without creating cookies", async () => {
    fetchMock.mockResolvedValue(
      backendResponse(401, {
        code: "401",
        message: "Invalid email or password",
        data: null,
      })
    );

    const response = await POST(
      makeRequest(validPayload)
    );

    expect(response.status).toBe(401);

    // Both incorrect credentials and unverified
    // accounts must receive the same response.
    expect(await response.json()).toEqual({
      code: "401",
      message: INVALID_CREDENTIALS_MESSAGE,
    });

    // Authentication failure must not create
    // access or refresh token cookies.
    expect(
      response.cookies.get("careertrack_access")
    ).toBeUndefined();

    expect(
      response.cookies.get("careertrack_refresh")
    ).toBeUndefined();

    expect(
      response.headers.get("Cache-Control")
    ).toBe("no-store");
  });

  // ========================================
  // 8. RATE LIMITING
  // ========================================

  it("returns 429 when rate limited", async () => {
    fetchMock.mockResolvedValue(
      backendResponse(429, {
        code: "429",
        message: "Too many requests",
      })
    );

    const response = await POST(
      makeRequest(validPayload)
    );

    expect(response.status).toBe(429);

    expect(await response.json()).toEqual({
      code: "429",
      message:
        "Too many login attempts. Please try again later.",
    });

    expect(
      response.cookies.get("careertrack_access")
    ).toBeUndefined();
  });

  // ========================================
  // 9. MALFORMED SUCCESS RESPONSE
  // ========================================

  it("rejects malformed successful upstream response", async () => {
    fetchMock.mockResolvedValue(
      backendResponse(200, {
        code: "200",
        data: {
          accessToken: "test-access-token",
          // Missing refreshToken.
        },
      })
    );

    const response = await POST(
      makeRequest(validPayload)
    );

    expect(response.status).toBe(502);

    expect(await response.json()).toEqual({
      code: "502",
      message:
        "Invalid authentication service response",
    });

    // Never create a partial session.
    expect(
      response.cookies.get("careertrack_access")
    ).toBeUndefined();

    expect(
      response.cookies.get("careertrack_refresh")
    ).toBeUndefined();
  });

  // ========================================
  // 10. BACKEND SERVER ERROR
  // ========================================

  it("returns 502 for upstream server error", async () => {
    fetchMock.mockResolvedValue(
      backendResponse(500, {
        code: "500",
        message: "Internal server error",
      })
    );

    const response = await POST(
      makeRequest(validPayload)
    );

    expect(response.status).toBe(502);

    expect(await response.json()).toEqual({
      code: "502",
      message:
        "Authentication service is temporarily unavailable",
    });

    expect(
      response.cookies.get("careertrack_access")
    ).toBeUndefined();
  });

  // ========================================
  // 11. GATEWAY NOT CONFIGURED
  // ========================================

  it("returns 503 when Gateway is not configured", async () => {
    vi.stubEnv("API_GATEWAY_URL", "");

    const response = await POST(
      makeRequest(validPayload)
    );

    expect(response.status).toBe(503);

    expect(await response.json()).toEqual({
      code: "503",
      message:
        "Authentication service is not configured",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  // ========================================
  // 12. NETWORK FAILURE
  // ========================================

  it("returns 503 when network fails", async () => {
    fetchMock.mockRejectedValue(
      new TypeError("fetch failed")
    );

    const response = await POST(
      makeRequest(validPayload)
    );

    expect(response.status).toBe(503);

    expect(await response.json()).toEqual({
      code: "503",
      message:
        "Unable to connect to authentication service",
    });

    expect(
      response.cookies.get("careertrack_access")
    ).toBeUndefined();
  });

  // ========================================
  // 13. GATEWAY TIMEOUT
  // ========================================

  it("returns 504 on timeout", async () => {
    const error = new Error("Request timeout");

    error.name = "TimeoutError";

    fetchMock.mockRejectedValue(error);

    const response = await POST(
      makeRequest(validPayload)
    );

    expect(response.status).toBe(504);

    expect(await response.json()).toEqual({
      code: "504",
      message: "Authentication request timed out",
    });

    expect(
      response.cookies.get("careertrack_access")
    ).toBeUndefined();

    expect(
      response.cookies.get("careertrack_refresh")
    ).toBeUndefined();
  });
});
