
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

const validPayload = {
  username: "careertrackuser",
  email: "careertrack@example.com",
  password: "Password123",
};

function makeRequest(body: unknown): Request {
  return new Request(
    "http://localhost:3000/api/v1/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
}

function makeBackendResponse(
  status: number,
  body: unknown
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Correlation-ID": "test-correlation-id",
    },
  });
}

describe("POST /api/v1/auth/register", () => {
  beforeEach(() => {
    fetchMock.mockReset();

    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv(
      "API_GATEWAY_URL",
      "http://127.0.0.1:8080"
    );

    // Suppress expected diagnostic output in tests.
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("forwards valid registration to API Gateway", async () => {
    fetchMock.mockResolvedValue(
      makeBackendResponse(201, {
        code: "201",
        message: "Registration successful",
        data: {
          id: "test-user-id",
          username: "careertrackuser",
          email: "careertrack@example.com",
        },
      })
    );

    const response = await POST(makeRequest(validPayload));

    expect(response.status).toBe(201);

    expect(await response.json()).toEqual({
      code: "201",
      message: "Registration successful",
    });

    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, options] = fetchMock.mock.calls[0];

    expect(url.toString()).toBe(
      "http://127.0.0.1:8080/api/auth/register"
    );

    expect(options?.method).toBe("POST");

    expect(JSON.parse(String(options?.body))).toEqual(
      validPayload
    );
  });

  it("rejects invalid registration payload before calling Gateway", async () => {
    const response = await POST(makeRequest({}));

    expect(response.status).toBe(400);

    const result = await response.json();

    expect(result.message).toBe(
      "Invalid registration data"
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const request = new Request(
      "http://localhost:3000/api/v1/auth/register",
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
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects role injection", async () => {
    const response = await POST(
      makeRequest({
        ...validPayload,
        role: "ADMIN",
      })
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 409 when email is already registered", async () => {
    fetchMock.mockResolvedValue(
      makeBackendResponse(409, {
        code: "409",
        message: "Email already registered",
        data: null,
      })
    );

    const response = await POST(makeRequest(validPayload));

    expect(response.status).toBe(409);

    const result = await response.json();

    expect(result.message).toBe(
      "Email already registered"
    );
  });

  it("returns 502 for unexpected upstream server errors", async () => {
    fetchMock.mockResolvedValue(
      makeBackendResponse(500, {
        message: "Internal Server Error",
      })
    );

    const response = await POST(makeRequest(validPayload));

    expect(response.status).toBe(502);
  });

  it("returns 503 when Gateway URL is missing", async () => {
    vi.stubEnv("API_GATEWAY_URL", "");

    const response = await POST(makeRequest(validPayload));

    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 503 when connection to Gateway fails", async () => {
    fetchMock.mockRejectedValue(
      new TypeError("fetch failed")
    );

    const response = await POST(makeRequest(validPayload));

    expect(response.status).toBe(503);
  });

  it("returns 504 when Gateway request times out", async () => {
    const timeoutError = new Error("Request timed out");
    timeoutError.name = "TimeoutError";

    fetchMock.mockRejectedValue(timeoutError);

    const response = await POST(makeRequest(validPayload));

    expect(response.status).toBe(504);
  });
});
