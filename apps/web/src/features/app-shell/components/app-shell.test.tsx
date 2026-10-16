
// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { AppShell } from "./app-shell";

const SIDEBAR_STORAGE_KEY = "careertrack.sidebar.collapsed";

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
  window.localStorage.clear();
  vi.clearAllMocks();
});

describe("AppShell", () => {
  beforeEach(() => {
    window.localStorage.clear();

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

    const sidebar = screen.getByLabelText(
      "Application sidebar"
    );

    const applications = sidebar.querySelector(
      '[aria-label="Applications"]'
    );

    expect(applications).toHaveAttribute(
      "aria-disabled",
      "true"
    );
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

  it("collapses and expands the desktop sidebar", () => {
    render(<AppShell>Content</AppShell>);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Collapse sidebar",
      })
    );

    expect(
      screen.getByRole("button", {
        name: "Expand sidebar",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Application sidebar")
    ).toHaveClass("w-[72px]");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Expand sidebar",
      })
    );

    expect(
      screen.getByLabelText("Application sidebar")
    ).toHaveClass("w-64");
  });

  it("persists collapsed sidebar preference", async () => {
    const { unmount } = render(
      <AppShell>Content</AppShell>
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Collapse sidebar",
      })
    );

    expect(
      window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    ).toBe("true");

    unmount();

    render(<AppShell>Content</AppShell>);

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Expand sidebar",
        })
      ).toBeInTheDocument();
    });
  });

  it("opens and closes mobile navigation", () => {
    render(<AppShell>Content</AppShell>);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open navigation",
      })
    );

    expect(
      screen.getByLabelText("Mobile sidebar")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Open navigation",
      })
    ).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close navigation",
      })
    );

    expect(
      screen.queryByLabelText("Mobile sidebar")
    ).not.toBeInTheDocument();
  });

  it("closes mobile navigation with Escape", () => {
    render(<AppShell>Content</AppShell>);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open navigation",
      })
    );

    expect(
      screen.getByLabelText("Mobile sidebar")
    ).toBeInTheDocument();

    fireEvent.keyDown(document, {
      key: "Escape",
    });

    expect(
      screen.queryByLabelText("Mobile sidebar")
    ).not.toBeInTheDocument();
  });

  it("keeps unfinished mobile routes disabled", () => {
    render(<AppShell>Content</AppShell>);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open navigation",
      })
    );

    const mobileNav = screen.getByRole("navigation", {
      name: "Mobile navigation",
    });

    expect(
      mobileNav.querySelector(
        'a[href="/applications"]'
      )
    ).toBeNull();

    expect(
      mobileNav.querySelector(
        '[aria-label="Applications"]'
      )
    ).toHaveAttribute("aria-disabled", "true");
  });
});
