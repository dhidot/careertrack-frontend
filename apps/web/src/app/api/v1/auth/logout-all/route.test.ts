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

const ACCESS = "header.payload.signature";
const REFRESH = "opaque-refresh-token-example-123";
const NEW_ACCESS = "new.access.signature";
const NEW_REFRESH = "new-refresh-token";

const URL_BASE = "http://localhost:3000/api/v1/auth/logout-all";

function makeRequest(
  cookies: { access?: string; refresh?: string } = {
    access: ACCESS,
    refresh: REFRESH,
  },
  origin: string | null = "http://localhost:3000"
): NextRequest {
  const headers: Record<string, string> = {};

  if (origin !== null) headers.Origin = origin;

  const parts: string[] = [];
  if (cookies.access) parts.push(`careertrack_access=${cookies.access}`);
  if (cookies.refresh) parts.push(`careertrack_refresh=${cookies.refresh}`);
  if (parts.length) headers.Cookie = parts.join("; ");

  return new NextRequest(URL_BASE, { method: "POST", headers });
}

function json(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function refreshOk(): Response {
  return json(200, {
    code: "200",
    data: { accessToken: NEW_ACCESS, refreshToken: NEW_REFRESH },
  });
}

function setCookies(response: Response): string {
  return response.headers.getSetCookie().join("\n");
}

describe("POST /api/v1/auth/logout-all", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("API_GATEWAY_URL", "http://127.0.0.1:8080");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("revokes all sessions on Auth and clears cookies", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { code: "200" }));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(setCookies(response)).toMatch(/careertrack_access=;.*Max-Age=0/);
    expect(setCookies(response)).toMatch(/careertrack_refresh=;.*Max-Age=0/);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("http://127.0.0.1:8080/api/auth/logout-all");
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      `Bearer ${ACCESS}`
    );
    expect(init?.body).toBeUndefined();
  });

  it("rejects cross-origin requests", async () => {
    const response = await POST(
      makeRequest(undefined, "https://evil.example")
    );

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps the user logged in when Auth fails (fail-closed)", async () => {
    fetchMock.mockResolvedValueOnce(json(500));

    const response = await POST(makeRequest());

    expect(response.status).toBe(502);
    expect(response.headers.getSetCookie()).toHaveLength(0);
  });

  it("returns 503 without clearing cookies when Auth is unreachable", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(503);
    expect(response.headers.getSetCookie()).toHaveLength(0);
  });

  it("returns 504 on upstream timeout", async () => {
    const timeout = new Error("timed out");
    timeout.name = "TimeoutError";
    fetchMock.mockRejectedValueOnce(timeout);

    expect((await POST(makeRequest())).status).toBe(504);
  });

  it("passes through rate limiting as 429", async () => {
    fetchMock.mockResolvedValueOnce(json(429));

    const response = await POST(makeRequest());

    expect(response.status).toBe(429);
    expect(response.headers.getSetCookie()).toHaveLength(0);
  });

  it("rotates once and retries when the access token expired", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401))
      .mockResolvedValueOnce(refreshOk())
      .mockResolvedValueOnce(json(200, { code: "200" }));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const [, retryInit] = fetchMock.mock.calls[2]!;
    expect(
      (retryInit?.headers as Record<string, string>).Authorization
    ).toBe(`Bearer ${NEW_ACCESS}`);
  });

  it("stores the rotated pair if the retry then fails", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401))
      .mockResolvedValueOnce(refreshOk())
      .mockResolvedValueOnce(json(500));

    const response = await POST(makeRequest());

    expect(response.status).toBe(502);
    expect(setCookies(response)).toContain(
      `careertrack_access=${NEW_ACCESS}`
    );
    expect(setCookies(response)).toContain(
      `careertrack_refresh=${NEW_REFRESH}`
    );
  });

  it("ends the session when refresh is rejected", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401))
      .mockResolvedValueOnce(json(401));

    const response = await POST(makeRequest());

    expect(response.status).toBe(401);
    expect(setCookies(response)).toMatch(/careertrack_refresh=;.*Max-Age=0/);
  });

  it("returns 401 and clears cookies when there are no session cookies", async () => {
    const response = await POST(makeRequest({}));

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 503 when the gateway URL is not configured", async () => {
    vi.stubEnv("API_GATEWAY_URL", "ftp://bad");

    const response = await POST(makeRequest());

    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
