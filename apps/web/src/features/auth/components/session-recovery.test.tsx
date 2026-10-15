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
  waitFor,
} from "@testing-library/react";

import { SessionRecovery } from "./session-recovery";
import { getSession } from "../lib/session-client";
import { navigateToDashboard } from "../lib/session-navigation";

const routerMocks = vi.hoisted(() => ({
  router: {
    replace: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks.router,
}));

vi.mock("../lib/session-client", () => ({
  getSession: vi.fn(),
}));

vi.mock(
  "@/features/dashboard/components/session-loading",
  () => ({
    SessionLoading: () => (
      <div role="status">Restoring session...</div>
    ),
  })
);

vi.mock("../lib/session-navigation", () => ({
  navigateToDashboard: vi.fn(),
}));

const mockGetSession = vi.mocked(getSession);

describe("SessionRecovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows loading while resolving session", () => {
    mockGetSession.mockReturnValue(
      new Promise(() => {})
    );

    render(<SessionRecovery />);

    expect(
      screen.getByRole("status")
    ).toBeTruthy();
  });

  it("redirects to login when session has expired", async () => {
    mockGetSession.mockResolvedValue({
      status: "unauthenticated",
    });

    render(<SessionRecovery />);

    await waitFor(() => {
      expect(routerMocks.router.replace).toHaveBeenCalledWith(
        "/login"
      );
    });

    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });

  it("blocks forbidden account without redirecting", async () => {
    mockGetSession.mockResolvedValue({
      status: "forbidden",
    });

    render(<SessionRecovery />);

    expect(
      await screen.findByText("Access denied")
    ).toBeTruthy();

    expect(routerMocks.router.replace).not.toHaveBeenCalled();
  });

  it("shows unavailable state without redirect loop", async () => {
    mockGetSession.mockResolvedValue({
      status: "unavailable",
    });

    render(<SessionRecovery />);

    expect(
      await screen.findByText("Authentication unavailable")
    ).toBeTruthy();

    expect(routerMocks.router.replace).not.toHaveBeenCalled();
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });

 it("navigates to dashboard after successful recovery", async () => {
  const user = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    username: "testuser",
    email: "user@example.com",
    roles: ["USER"] as ["USER"],
    permissions: [],
  };

  mockGetSession.mockResolvedValue({
    status: "authenticated",
    user,
  });

  render(<SessionRecovery />);

  await waitFor(() => {
    expect(navigateToDashboard).toHaveBeenCalledTimes(1);
  });

  expect(routerMocks.router.replace).not.toHaveBeenCalled();
  expect(mockGetSession).toHaveBeenCalledTimes(1);
});
});