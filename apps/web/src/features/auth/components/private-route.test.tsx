// @vitest-environment jsdom

import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { PrivateRoute } from "./private-route";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  status: "loading" as
    | "loading"
    | "authenticated"
    | "unauthenticated"
    | "forbidden"
    | "unavailable",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mocks.replace,
  }),
}));

vi.mock("./auth-provider", () => ({
  useAuth: () => ({
    status: mocks.status,
    user: null,
    refreshSession: vi.fn(),
  }),
}));

vi.mock(
  "@/features/dashboard/components/session-loading",
  () => ({
    SessionLoading: () => (
      <div role="status">Checking your CareerTrack session</div>
    ),
  })
);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.status = "loading";
});

function renderPrivateRoute() {
  return render(
    <PrivateRoute>
      <div data-testid="private-content">
        Confidential CareerTrack Dashboard
      </div>
    </PrivateRoute>
  );
}

describe("PrivateRoute", () => {
  it("shows session loading without exposing private content", () => {
    mocks.status = "loading";

    renderPrivateRoute();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Checking your CareerTrack session"
    );

    expect(
      screen.queryByTestId("private-content")
    ).not.toBeInTheDocument();

    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("renders private content when authenticated", () => {
    mocks.status = "authenticated";

    renderPrivateRoute();

    expect(
      screen.getByTestId("private-content")
    ).toBeInTheDocument();

    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated users to login", () => {
    mocks.status = "unauthenticated";

    renderPrivateRoute();

    expect(
      screen.queryByTestId("private-content")
    ).not.toBeInTheDocument();

    expect(mocks.replace).toHaveBeenCalledWith("/login");
  });

  it("blocks forbidden users from accessing private content", () => {
    mocks.status = "forbidden";

    renderPrivateRoute();

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      "You do not have permission to access CareerTrack."
    );

    expect(
      screen.queryByTestId("private-content")
    ).not.toBeInTheDocument();
  });

  it("fails closed when authentication service is unavailable", () => {
    mocks.status = "unavailable";

    renderPrivateRoute();

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      "Authentication service is temporarily unavailable."
    );

    expect(
      screen.queryByTestId("private-content")
    ).not.toBeInTheDocument();
  });
});