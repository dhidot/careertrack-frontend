
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { NextRequest } from "next/server";
import { GET } from "./route";

const fetchMock = vi.fn<typeof fetch>();

const ACCESS_TOKEN = "header.payload.signature";

const validUser = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  username: "testuser",
  email: "user@example.com",
  roles: ["USER"],
  permissions: [],
};

function makeRequest(
  token?: string
): NextRequest {
  return new NextRequest(
    "http://localhost:3000/api/v1/auth/me",
    {
      method: "GET",
      headers: token
        ? {
            Cookie: `careertrack_access=${token}`,
          }
        : {},
    }
  );
}

function upstreamResponse(
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

describe("GET /api/v1/auth/me", () => {
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
  });

  it("returns 401 without an access cookie", async () => {
    const response = await GET(makeRequest());

    expect(response.status).toBe(401);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects malformed access token", async () => {
    const response = await GET(
      makeRequest("invalid-token")
    );

    expect(response.status).toBe(401);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns authenticated USER profile", async () => {
    fetchMock.mockResolvedValueOnce(
      upstreamResponse(200, {
        code: "200",
        message: "Success",
        data: validUser,
      })
    );

    const response = await GET(
      makeRequest(ACCESS_TOKEN)
    );

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body.data).toEqual(validUser);

    expect(response.headers.get("Cache-Control"))
      .toBe("no-store");

    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        "http://127.0.0.1:8080/api/auth/me"
      ),
      expect.objectContaining({
        method: "GET",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          Accept: "application/json",
        },
        cache: "no-store",
        redirect: "error",
      })
    );
  });

  it("rejects ADMIN from CareerTrack Web", async () => {
    fetchMock.mockResolvedValueOnce(
      upstreamResponse(200, {
        code: "200",
        message: "Success",
        data: {
          ...validUser,
          roles: ["ADMIN"],
          permissions: ["ADMIN_USER_READ"],
        },
      })
    );

    const response = await GET(
      makeRequest(ACCESS_TOKEN)
    );

    expect(response.status).toBe(403);
  });

  it("forwards backend 401 without exposing tokens", async () => {
    fetchMock.mockResolvedValueOnce(
      upstreamResponse(401, {
        code: "401",
        message: "Unauthorized",
      })
    );

    const response = await GET(
      makeRequest(ACCESS_TOKEN)
    );

    const body = await response.json();

    expect(response.status).toBe(401);
    expect(JSON.stringify(body)).not.toContain(
      ACCESS_TOKEN
    );
  });

  it("returns 502 for invalid backend response", async () => {
    fetchMock.mockResolvedValueOnce(
      upstreamResponse(200, {
        code: "200",
        message: "Success",
        data: {
          username: "incomplete",
        },
      })
    );

    const response = await GET(
      makeRequest(ACCESS_TOKEN)
    );

    expect(response.status).toBe(502);
  });

  it("returns 503 when gateway configuration is missing", async () => {
    vi.stubEnv("API_GATEWAY_URL", "");

    const response = await GET(
      makeRequest(ACCESS_TOKEN)
    );

    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 503 when gateway is unreachable", async () => {
    fetchMock.mockRejectedValueOnce(
      new Error("Connection refused")
    );

    const response = await GET(
      makeRequest(ACCESS_TOKEN)
    );

    expect(response.status).toBe(503);
  });
});
