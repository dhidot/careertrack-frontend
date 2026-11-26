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

const URL_BASE = "http://localhost:3000/api/v1/auth/logout";

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

function expectCookiesCleared(response: Response) {
  const setCookie = response.headers.getSetCookie().join("\n");

  expect(setCookie).toMatch(/careertrack_access=;/);
  expect(setCookie).toMatch(/careertrack_refresh=;/);
  expect(setCookie).toMatch(/Max-Age=0/);
  expect(setCookie).toMatch(/HttpOnly/i);
  expect(setCookie).toMatch(/Path=\//);
}

function lastCall(index: number) {
  const [url, init] = fetchMock.mock.calls[index]!;
  return {
    url: String(url),
    headers: init?.headers as Record<string, string>,
    body: init?.body ? JSON.parse(String(init.body)) : undefined,
  };
}

describe("POST /api/v1/auth/logout", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("API_GATEWAY_URL", "http://127.0.0.1:8080");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("revokes the refresh token on Auth and clears both cookies", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { code: "200" }));

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({ sessionRevoked: true });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expectCookiesCleared(response);

    const call = lastCall(0);
    expect(call.url).toBe("http://127.0.0.1:8080/api/auth/logout");
    expect(call.headers.Authorization).toBe(`Bearer ${ACCESS}`);
    expect(call.body).toEqual({ refreshToken: REFRESH });
  });

  it("never returns tokens in the response body", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { code: "200" }));

    const text = await (await POST(makeRequest())).text();

    expect(text).not.toContain(ACCESS);
    expect(text).not.toContain(REFRESH);
  });

  it("rejects cross-origin requests without touching cookies", async () => {
    const response = await POST(
      makeRequest(undefined, "https://evil.example")
    );

    expect(response.status).toBe(403);
    expect(response.headers.getSetCookie()).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects requests with no Origin header", async () => {
    const response = await POST(makeRequest(undefined, null));

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rotates once and revokes the new token when access token expired", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401))
      .mockResolvedValueOnce(refreshOk())
      .mockResolvedValueOnce(json(200, { code: "200" }));

    const response = await POST(makeRequest());

    expect((await response.json()).data.sessionRevoked).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    expect(lastCall(1).url).toContain("/api/auth/refresh");
    expect(lastCall(1).body).toEqual({ refreshToken: REFRESH });

    const retry = lastCall(2);
    expect(retry.url).toContain("/api/auth/logout");
    expect(retry.headers.Authorization).toBe(`Bearer ${NEW_ACCESS}`);
    expect(retry.body).toEqual({ refreshToken: NEW_REFRESH });

    expectCookiesCleared(response);
  });

  it("goes straight to rotation when only the refresh cookie exists", async () => {
    fetchMock
      .mockResolvedValueOnce(refreshOk())
      .mockResolvedValueOnce(json(200, { code: "200" }));

    const response = await POST(makeRequest({ refresh: REFRESH }));

    expect((await response.json()).data.sessionRevoked).toBe(true);
    expect(lastCall(0).url).toContain("/api/auth/refresh");
  });

  it("still clears cookies when the refresh token is already invalid", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401))
      .mockResolvedValueOnce(json(401));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect((await response.json()).data.sessionRevoked).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expectCookiesCleared(response);
  });

  it("still clears cookies when Auth Service is unreachable", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect((await response.json()).data.sessionRevoked).toBe(false);
    expectCookiesCleared(response);
  });

  it("does not retry with rotation on non-401 upstream errors", async () => {
    fetchMock.mockResolvedValueOnce(json(500));

    const response = await POST(makeRequest());

    expect((await response.json()).data.sessionRevoked).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expectCookiesCleared(response);
  });

  it("clears cookies without calling Auth when there is no refresh cookie", async () => {
    const response = await POST(makeRequest({ access: ACCESS }));

    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    expectCookiesCleared(response);
  });

  it("clears cookies when the gateway URL is not configured", async () => {
    vi.stubEnv("API_GATEWAY_URL", "");

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    expectCookiesCleared(response);
  });

  it("does not forward a malformed access cookie as a bearer token", async () => {
    fetchMock
      .mockResolvedValueOnce(refreshOk())
      .mockResolvedValueOnce(json(200, { code: "200" }));

    await POST(makeRequest({ access: "not-a-jwt", refresh: REFRESH }));

    expect(lastCall(0).url).toContain("/api/auth/refresh");
    expect(lastCall(0).headers.Authorization).toBeUndefined();
  });
});
