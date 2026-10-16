// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { AppShell } from "./app-shell";

const mocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
}));

vi.mock("@/features/auth/components/auth-provider", () => ({
  useAuth: mocks.useAuth,
}));

afterEach(() => {
  cleanup();
});

describe("AppShell", () => {
  beforeEach(() => {
    mocks.usePathname.mockReturnValue("/dashboard");

    mocks.useAuth.mockReturnValue({
      user: {
        username: "didot",
        role: "USER",
      },
      status: "authenticated",
    });
  });

  it("renders dashboard content", () => {
    render(
      <AppShell>
        <p>Dashboard content</p>
      </AppShell>
    );

    expect(
      screen.getByText("Dashboard content")
    ).toBeInTheDocument();
  });

  it("renders sidebar navigation", () => {
    render(<AppShell>Content</AppShell>);

    expect(
      screen.getByRole("navigation", {
        name: "Main navigation",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Overview",
      })
    ).toHaveAttribute("aria-current", "page");
  });

  it("does not expose unfinished routes as links", () => {
    render(<AppShell>Content</AppShell>);

    expect(
      screen.queryByRole("link", {
        name: "Applications",
      })
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("Applications")
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("renders authenticated user profile", () => {
    render(<AppShell>Content</AppShell>);

    expect(
      screen.getByText("didot")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("didot profile")
    ).toBeInTheDocument();
  });

  it("provides a main content landmark", () => {
    render(<AppShell>Content</AppShell>);

    expect(
      screen.getByRole("main")
    ).toHaveAttribute("id", "main-content");
  });
});