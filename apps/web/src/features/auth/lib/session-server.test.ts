
import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));

import { getServerSession } from "./session-server";

const VALID_JWT = "header.payload.signature";

const USER = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  username: "testuser",
  email: "user@example.com",
  roles: ["USER"],
  permissions: [],
};

function backendResponse(user: typeof USER) {
  return {
    code: "200",
    message: "Success",
    data: user,
  };
}

describe("getServerSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("API_GATEWAY_URL", "https://api.example.com");

    mocks.cookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({
        value: VALID_JWT,
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns unauthenticated when access cookie is missing", async () => {
    mocks.cookies.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });

    const result = await getServerSession();

    expect(result).toEqual({
      status: "unauthenticated",
    });
  });

  it("rejects malformed access token", async () => {
    mocks.cookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({
        value: "invalid-token",
      }),
    });

    const result = await getServerSession();

    expect(result).toEqual({
      status: "unauthenticated",
    });
  });

  it("authenticates a valid USER session", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify(backendResponse(USER)),
        { status: 200 }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await getServerSession();

    expect(result).toEqual({
      status: "authenticated",
      user: USER,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("https://api.example.com/api/auth/me"),
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: expect.objectContaining({
          Authorization: `Bearer ${VALID_JWT}`,
        }),
      })
    );
  });

  it("rejects ADMIN from the USER application", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify(
            backendResponse({
              ...USER,
              roles: ["ADMIN"],
            })
          ),
          { status: 200 }
        )
      )
    );

    const result = await getServerSession();

    expect(result).toEqual({
      status: "forbidden",
    });
  });

  it("returns unauthenticated when access token expires", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(null, { status: 401 })
      )
    );

    const result = await getServerSession();

    expect(result).toEqual({
      status: "unauthenticated",
    });
  });

  it("returns unavailable when Auth Service is down", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(
        new Error("Connection refused")
      )
    );

    const result = await getServerSession();

    expect(result).toEqual({
      status: "unavailable",
    });
  });
});
