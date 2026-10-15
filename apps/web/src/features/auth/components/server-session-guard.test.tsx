// @vitest-environment jsdom

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  cleanup,
  render,
  screen,
} from "@testing-library/react";

import { ServerSessionGuard } from "./server-session-guard";
import { getServerSession } from "../lib/session-server";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("../lib/session-server", () => ({
  getServerSession: vi.fn(),
}));

const mockGetServerSession = vi.mocked(getServerSession);

const user = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  username: "testuser",
  email: "user@example.com",
  roles: ["USER"] as ["USER"],
  permissions: [],
};

describe("ServerSessionGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders private content for authenticated USER", async () => {
    mockGetServerSession.mockResolvedValue({
      status: "authenticated",
      user,
    });

    const element = await ServerSessionGuard({
      children: <div>Private Dashboard</div>,
    });

    render(element);

    expect(
      screen.getByText("Private Dashboard")
    ).toBeTruthy();

    expect(mockGetServerSession).toHaveBeenCalledTimes(1);
  });

  it("redirects unauthenticated session to recovery", async () => {
    mockGetServerSession.mockResolvedValue({
      status: "unauthenticated",
    });

    await expect(
      ServerSessionGuard({
        children: <div>Private Dashboard</div>,
      })
    ).rejects.toThrow(
      "NEXT_REDIRECT:/session/recover?next=%2Fdashboard"
    );

    expect(
      screen.queryByText("Private Dashboard")
    ).toBeNull();
  });

  it("blocks forbidden session", async () => {
    mockGetServerSession.mockResolvedValue({
      status: "forbidden",
    });

    const element = await ServerSessionGuard({
      children: <div>Private Dashboard</div>,
    });

    render(element);

    expect(
      screen.getByText("Access denied")
    ).toBeTruthy();

    expect(
      screen.queryByText("Private Dashboard")
    ).toBeNull();
  });

  it("blocks private content when auth service is unavailable", async () => {
    mockGetServerSession.mockResolvedValue({
      status: "unavailable",
    });

    const element = await ServerSessionGuard({
      children: <div>Private Dashboard</div>,
    });

    render(element);

    expect(
      screen.getByText("Authentication unavailable")
    ).toBeTruthy();

    expect(
      screen.queryByText("Private Dashboard")
    ).toBeNull();
  });
});