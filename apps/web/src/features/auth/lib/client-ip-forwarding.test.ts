import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { NextRequest } from "next/server";

import {
  BFF_KEY_HEADER,
  CLIENT_IP_HEADER,
  clientIpOf,
  gatewayClientHeaders,
} from "./auth-upstream";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { POST as refresh } from "@/app/api/v1/auth/refresh/route";
import { POST as logout } from "@/app/api/v1/auth/logout/route";

const KEY = "bff-key-for-tests-0123456789abcdef";
const fetchMock = vi.fn<typeof fetch>();

function req(headers: Record<string, string>): Request {
  return new Request("http://localhost:3000/x", { headers });
}

function sentHeaders(call: number): Record<string, string> {
  return fetchMock.mock.calls[call]![1]!.headers as Record<string, string>;
}

function json(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("clientIpOf", () => {
  it("prefers x-real-ip", () => {
    expect(
      clientIpOf(req({ "x-real-ip": "203.0.113.9", "x-forwarded-for": "198.51.100.1" }))
    ).toBe("203.0.113.9");
  });

  it("falls back to the first x-forwarded-for hop", () => {
    expect(
      clientIpOf(req({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" }))
    ).toBe("198.51.100.1");
  });

  it("accepts IPv6", () => {
    expect(clientIpOf(req({ "x-real-ip": "2001:db8::7" }))).toBe("2001:db8::7");
  });

  it("ignores values that are not IP addresses", () => {
    expect(
      clientIpOf(req({ "x-real-ip": "evil.example", "x-forwarded-for": "<script>" }))
    ).toBeNull();
    expect(clientIpOf(req({}))).toBeNull();
  });
});

describe("gatewayClientHeaders", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("sends nothing when GATEWAY_BFF_KEY is not set", () => {
    vi.stubEnv("GATEWAY_BFF_KEY", "");
    expect(gatewayClientHeaders(req({ "x-real-ip": "203.0.113.9" }))).toEqual({});
  });

  it("sends nothing when the client IP is unknown", () => {
    vi.stubEnv("GATEWAY_BFF_KEY", KEY);
    expect(gatewayClientHeaders(req({}))).toEqual({});
  });

  it("sends the client IP together with the key", () => {
    vi.stubEnv("GATEWAY_BFF_KEY", KEY);
    expect(gatewayClientHeaders(req({ "x-real-ip": "203.0.113.9" }))).toEqual({
      [CLIENT_IP_HEADER]: "203.0.113.9",
      [BFF_KEY_HEADER]: KEY,
    });
  });
});

describe("BFF routes forward the client IP to the gateway", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("API_GATEWAY_URL", "http://127.0.0.1:8080");
    vi.stubEnv("GATEWAY_BFF_KEY", KEY);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("login", async () => {
    fetchMock.mockResolvedValueOnce(json(401));

    await login(
      new Request("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          "x-real-ip": "203.0.113.9",
        },
        body: JSON.stringify({ email: "user@example.com", password: "Password123" }),
      })
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(sentHeaders(0)[CLIENT_IP_HEADER]).toBe("203.0.113.9");
    expect(sentHeaders(0)[BFF_KEY_HEADER]).toBe(KEY);
  });

  it("refresh", async () => {
    fetchMock.mockResolvedValueOnce(json(401));

    await refresh(
      new NextRequest("http://localhost:3000/api/v1/auth/refresh", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          Cookie: "careertrack_refresh=opaque-refresh",
          "x-forwarded-for": "198.51.100.4",
        },
      })
    );

    expect(sentHeaders(0)[CLIENT_IP_HEADER]).toBe("198.51.100.4");
  });

  it("logout, including the token rotation it may perform", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401))
      .mockResolvedValueOnce(
        json(200, { code: "200", data: { accessToken: "a.b.c", refreshToken: "r2" } })
      )
      .mockResolvedValueOnce(json(200, { code: "200" }));

    await logout(
      new NextRequest("http://localhost:3000/api/v1/auth/logout", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          Cookie: "careertrack_access=h.p.s; careertrack_refresh=r1",
          "x-real-ip": "203.0.113.20",
        },
      })
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const call of [0, 1, 2]) {
      expect(sentHeaders(call)[CLIENT_IP_HEADER]).toBe("203.0.113.20");
      expect(sentHeaders(call)[BFF_KEY_HEADER]).toBe(KEY);
    }
  });

  it("does not forward anything when the key is missing", async () => {
    vi.stubEnv("GATEWAY_BFF_KEY", "");
    fetchMock.mockResolvedValueOnce(json(401));

    await refresh(
      new NextRequest("http://localhost:3000/api/v1/auth/refresh", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          Cookie: "careertrack_refresh=opaque-refresh",
          "x-real-ip": "203.0.113.9",
        },
      })
    );

    expect(sentHeaders(0)[CLIENT_IP_HEADER]).toBeUndefined();
    expect(sentHeaders(0)[BFF_KEY_HEADER]).toBeUndefined();
  });
});
