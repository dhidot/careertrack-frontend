
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

import { ProfileMenu } from "./profile-menu";

const signOutMock = vi.hoisted(() => vi.fn());
const navigateToLoginMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth/lib/session-client", () => ({
  signOut: signOutMock,
}));

vi.mock("@/features/auth/lib/session-navigation", () => ({
  navigateToLogin: navigateToLoginMock,
}));

vi.mock(
  "@/features/auth/components/auth-provider",
  () => ({
    useAuth: () => ({
      user: {
        username: "testuser",
        email: "user@example.com",
      },
    }),
  })
);

beforeEach(() => {
  signOutMock.mockReset();
  navigateToLoginMock.mockReset();
});

afterEach(() => {
  cleanup();
});

function openMenu() {
  render(<ProfileMenu />);
  fireEvent.click(
    screen.getByRole("button", { name: "Open profile menu" })
  );
}

describe("ProfileMenu", () => {
  it("renders profile trigger", () => {
    render(<ProfileMenu />);

    expect(
      screen.getByRole("button", {
        name: "Open profile menu",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("testuser")
    ).toBeInTheDocument();
  });

  it("opens menu on click", () => {
    render(<ProfileMenu />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open profile menu",
      })
    );

    expect(
      screen.getByRole("menu", {
        name: "Profile actions",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("user@example.com")
    ).toBeInTheDocument();
  });

  it("closes menu on Escape", () => {
    render(<ProfileMenu />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open profile menu",
      })
    );

    fireEvent.keyDown(document, {
      key: "Escape",
    });

    expect(
      screen.queryByRole("menu")
    ).not.toBeInTheDocument();
  });

  it("closes menu when clicking outside", () => {
    render(
      <div>
        <ProfileMenu />
        <button type="button">Outside</button>
      </div>
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open profile menu",
      })
    );

    fireEvent.pointerDown(
      screen.getByRole("button", {
        name: "Outside",
      })
    );

    expect(
      screen.queryByRole("menu")
    ).not.toBeInTheDocument();
  });

  it("signs out the current session and navigates to login", async () => {
    signOutMock.mockResolvedValueOnce("signed-out");
    openMenu();

    fireEvent.click(
      screen.getByRole("menuitem", { name: "Sign out" })
    );

    await waitFor(() => {
      expect(navigateToLoginMock).toHaveBeenCalledOnce();
    });
    expect(signOutMock).toHaveBeenCalledWith("current");
  });

  it("disables both actions while signing out", async () => {
    signOutMock.mockReturnValueOnce(new Promise(() => {}));
    openMenu();

    fireEvent.click(
      screen.getByRole("menuitem", { name: "Sign out" })
    );

    expect(
      await screen.findByRole("menuitem", { name: "Signing out…" })
    ).toBeDisabled();
    expect(
      screen.getByRole("menuitem", { name: "Sign out of all devices" })
    ).toBeDisabled();
  });

  it("signs out of all devices", async () => {
    signOutMock.mockResolvedValueOnce("signed-out");
    openMenu();

    fireEvent.click(
      screen.getByRole("menuitem", { name: "Sign out of all devices" })
    );

    await waitFor(() => {
      expect(navigateToLoginMock).toHaveBeenCalledOnce();
    });
    expect(signOutMock).toHaveBeenCalledWith("all");
  });

  it("stays on the page and shows an error when logout-all fails", async () => {
    signOutMock.mockResolvedValueOnce("unavailable");
    openMenu();

    fireEvent.click(
      screen.getByRole("menuitem", { name: "Sign out of all devices" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /couldn't sign out/i
    );
    expect(navigateToLoginMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole("menuitem", { name: "Sign out of all devices" })
    ).toBeEnabled();
  });

  it("shows a rate-limit message", async () => {
    signOutMock.mockResolvedValueOnce("rate-limited");
    openMenu();

    fireEvent.click(
      screen.getByRole("menuitem", { name: "Sign out of all devices" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /too many attempts/i
    );
  });

  it("moves focus between items with arrow keys", () => {
    openMenu();

    const signOutItem = screen.getByRole("menuitem", { name: "Sign out" });
    const allItem = screen.getByRole("menuitem", {
      name: "Sign out of all devices",
    });
    const menu = screen.getByRole("menu");

    signOutItem.focus();
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(allItem).toHaveFocus();

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(signOutItem).toHaveFocus();

    fireEvent.keyDown(menu, { key: "ArrowUp" });
    expect(allItem).toHaveFocus();
  });
});
