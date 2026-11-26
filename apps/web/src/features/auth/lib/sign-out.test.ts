import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { signOut } from "./session-client";

const fetchMock = vi.fn<typeof fetch>();

function status(code: number): Response {
  return new Response("{}", { status: code });
}

describe("signOut", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts to the logout BFF route for the current session", async () => {
    fetchMock.mockResolvedValueOnce(status(200));

    expect(await signOut("current")).toBe("signed-out");

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/v1/auth/logout");
    expect(init?.method).toBe("POST");
    expect(init?.credentials).toBe("same-origin");
  });

  it("posts to the logout-all BFF route for every device", async () => {
    fetchMock.mockResolvedValueOnce(status(200));

    expect(await signOut("all")).toBe("signed-out");
    expect(fetchMock.mock.calls[0]![0]).toBe("/api/v1/auth/logout-all");
  });

  it("treats 401 as already signed out", async () => {
    fetchMock.mockResolvedValueOnce(status(401));

    expect(await signOut("all")).toBe("signed-out");
  });

  it("reports rate limiting", async () => {
    fetchMock.mockResolvedValueOnce(status(429));

    expect(await signOut("all")).toBe("rate-limited");
  });

  it("reports upstream failures as unavailable", async () => {
    fetchMock.mockResolvedValueOnce(status(502));

    expect(await signOut("all")).toBe("unavailable");
  });

  it("reports a network error as unavailable, even for the current session", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    expect(await signOut("current")).toBe("unavailable");
  });
});
