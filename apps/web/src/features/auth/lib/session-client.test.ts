
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { getSession } from "./session-client";

const fetchMock = vi.fn<typeof fetch>();

const validUser = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  username: "testuser",
  email: "user@example.com",
  roles: ["USER"],
  permissions: [],
};

function reply(
  status: number,
  body: unknown = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function meSuccess(
  overrides: Record<string, unknown> = {}
): Response {
  return reply(200, {
    code: "200",
    message: "Success",
    data: {
      ...validUser,
      ...overrides,
    },
  });
}

describe("Session Coordinator", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns authenticated user when access token is valid", async () => {
    fetchMock.mockResolvedValueOnce(meSuccess());

    const result = await getSession();

    expect(result).toEqual({
      status: "authenticated",
      user: validUser,
    });

    expect(fetchMock).toHaveBeenCalledOnce();

    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/v1/auth/me"
    );

    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      credentials: "same-origin",
      cache: "no-store",
    });
  });

  it("refreshes and retries me once when access token is expired", async () => {
    fetchMock
      .mockResolvedValueOnce(reply(401))
      .mockResolvedValueOnce(reply(200))
      .mockResolvedValueOnce(meSuccess());

    const result = await getSession();

    expect(result.status).toBe("authenticated");

    expect(
      fetchMock.mock.calls.map(([url]) => url)
    ).toEqual([
      "/api/v1/auth/me",
      "/api/v1/auth/refresh",
      "/api/v1/auth/me",
    ]);

    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: "POST",
      credentials: "same-origin",
    });
  });

  it("deduplicates concurrent session requests", async () => {
    fetchMock
      .mockResolvedValueOnce(reply(401))
      .mockResolvedValueOnce(reply(200))
      .mockResolvedValueOnce(meSuccess());

    const first = getSession();
    const second = getSession();
    const third = getSession();

    expect(first).toBe(second);
    expect(second).toBe(third);

    const results = await Promise.all([
      first,
      second,
      third,
    ]);

    expect(
      results.every(
        (result) =>
          result.status === "authenticated"
      )
    ).toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(3);

    const refreshCalls = fetchMock.mock.calls.filter(
      ([url]) => url === "/api/v1/auth/refresh"
    );

    expect(refreshCalls).toHaveLength(1);
  });

  it("returns unauthenticated when refresh is rejected", async () => {
    fetchMock
      .mockResolvedValueOnce(reply(401))
      .mockResolvedValueOnce(reply(401));

    const result = await getSession();

    expect(result).toEqual({
      status: "unauthenticated",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry refresh repeatedly if me still returns 401", async () => {
    fetchMock
      .mockResolvedValueOnce(reply(401))
      .mockResolvedValueOnce(reply(200))
      .mockResolvedValueOnce(reply(401));

    const result = await getSession();

    expect(result).toEqual({
      status: "unauthenticated",
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("returns forbidden for an ADMIN session", async () => {
    fetchMock.mockResolvedValueOnce(
      meSuccess({ roles: ["ADMIN"] })
    );

    const result = await getSession();

    expect(result).toEqual({
      status: "forbidden",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("does not refresh when me returns a server error", async () => {
    fetchMock.mockResolvedValueOnce(reply(503));

    const result = await getSession();

    expect(result).toEqual({
      status: "unavailable",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("returns unavailable when refresh service fails", async () => {
    fetchMock
      .mockResolvedValueOnce(reply(401))
      .mockResolvedValueOnce(reply(504));

    const result = await getSession();

    expect(result).toEqual({
      status: "unavailable",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects malformed me responses", async () => {
    fetchMock.mockResolvedValueOnce(
      reply(200, {
        code: "200",
        data: {
          username: "missing-fields",
        },
      })
    );

    const result = await getSession();

    expect(result).toEqual({
      status: "unavailable",
    });
  });

  it("returns unavailable when network request fails", async () => {
    fetchMock.mockRejectedValueOnce(
      new Error("Network unavailable")
    );

    const result = await getSession();

    expect(result).toEqual({
      status: "unavailable",
    });
  });

  it("releases the single-flight promise after completion", async () => {
    fetchMock
      .mockResolvedValueOnce(meSuccess())
      .mockResolvedValueOnce(meSuccess());

    const first = await getSession();
    const second = await getSession();

    expect(first.status).toBe("authenticated");
    expect(second.status).toBe("authenticated");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
