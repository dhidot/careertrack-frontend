
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { POST } from "./route";

const fetchMock = vi.fn<typeof fetch>();

const VALID_TOKEN = "A".repeat(43);

function makeRequest(
  body: unknown,
  origin?: string
): Request {
  return new Request(
    "http://localhost:3000/api/v1/auth/verify-email",
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

describe("POST /api/v1/auth/verify-email", () => {
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

  it("forwards valid token and returns HTTP 200", async () => {
    fetchMock.mockResolvedValue(
      backendResponse(200, {
        code: "200",
        message: "Email verified successfully",
        data: null,
      })
    );

    const response = await POST(
      makeRequest({ token: VALID_TOKEN })
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, options] = fetchMock.mock.calls[0];

    expect(url.toString()).toBe(
      "http://127.0.0.1:8080/api/auth/verify-email"
    );

    expect(options?.method).toBe("POST");

    expect(
      JSON.parse(String(options?.body))
    ).toEqual({ token: VALID_TOKEN });

    expect(options?.headers).toEqual({
      "Content-Type": "application/json",
    });

    expect(await response.json()).toEqual({
      code: "200",
      message: "Email verified successfully",
    });

    expect(
      response.headers.get("Cache-Control")
    ).toBe("no-store");

    expect(
      response.cookies.get("careertrack_access")
    ).toBeUndefined();

    expect(
      response.cookies.get("careertrack_refresh")
    ).toBeUndefined();
  });

  it("rejects invalid token format", async () => {
    const response = await POST(
      makeRequest({ token: "invalid-token" })
    );

    expect(response.status).toBe(400);

    expect(await response.json()).toEqual({
      code: "400",
      message: "Invalid verification token",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects unexpected request fields", async () => {
    const response = await POST(
      makeRequest({
        token: VALID_TOKEN,
        role: "ADMIN",
      })
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const request = new Request(
      "http://localhost:3000/api/v1/auth/verify-email",
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

  it("rejects cross-origin requests", async () => {
    const response = await POST(
      makeRequest(
        { token: VALID_TOKEN },
        "https://another-site.example"
      )
    );

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts same-origin requests", async () => {
    fetchMock.mockResolvedValue(
      backendResponse(400, {
        code: "400",
        message: "Invalid or expired verification token",
        data: null,
      })
    );

    const response = await POST(
      makeRequest(
        { token: VALID_TOKEN },
        "http://localhost:3000"
      )
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(response.status).toBe(400);
  });

  it("handles invalid, expired, and reused tokens", async () => {
    fetchMock.mockResolvedValue(
      backendResponse(400, {
        code: "400",
        message: "Invalid or expired verification token",
        data: null,
      })
    );

    const response = await POST(
      makeRequest({ token: VALID_TOKEN })
    );

    expect(response.status).toBe(400);

    expect(await response.json()).toEqual({
      code: "400",
      message: "Invalid or expired verification token",
    });

    expect(
      response.headers.get("Cache-Control")
    ).toBe("no-store");
  });

  it("rejects malformed success response", async () => {
    fetchMock.mockResolvedValue(
      backendResponse(200, {
        code: "500",
        message: "Unexpected response",
      })
    );

    const response = await POST(
      makeRequest({ token: VALID_TOKEN })
    );

    expect(response.status).toBe(502);

    expect(await response.json()).toEqual({
      code: "502",
      message: "Invalid verification service response",
    });
  });

  it("returns 502 for unexpected upstream authorization failure", async () => {
    fetchMock.mockResolvedValue(
      backendResponse(401, {
        code: "401",
        message: "Unauthorized",
      })
    );

    const response = await POST(
      makeRequest({ token: VALID_TOKEN })
    );

    expect(response.status).toBe(502);
  });

  it("returns 429 when rate limited", async () => {
    fetchMock.mockResolvedValue(
      backendResponse(429, {
        code: "429",
        message: "Too many requests",
      })
    );

    const response = await POST(
      makeRequest({ token: VALID_TOKEN })
    );

    expect(response.status).toBe(429);

    expect(await response.json()).toEqual({
      code: "429",
      message:
        "Too many verification attempts. Please try again later.",
    });
  });

  it("returns 503 without Gateway configuration", async () => {
    vi.stubEnv("API_GATEWAY_URL", "");

    const response = await POST(
      makeRequest({ token: VALID_TOKEN })
    );

    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 503 when Gateway is unreachable", async () => {
    fetchMock.mockRejectedValue(
      new TypeError("fetch failed")
    );

    const response = await POST(
      makeRequest({ token: VALID_TOKEN })
    );

    expect(response.status).toBe(503);

    expect(await response.json()).toEqual({
      code: "503",
      message:
        "Unable to connect to verification service",
    });
  });

  it("returns 504 on timeout", async () => {
    const error = new Error("Request timeout");
    error.name = "TimeoutError";

    fetchMock.mockRejectedValue(error);

    const response = await POST(
      makeRequest({ token: VALID_TOKEN })
    );

    expect(response.status).toBe(504);

    expect(await response.json()).toEqual({
      code: "504",
      message: "Verification request timed out",
    });
  });
});
