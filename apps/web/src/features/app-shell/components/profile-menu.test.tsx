
// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { ProfileMenu } from "./profile-menu";

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

afterEach(() => {
  cleanup();
});

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

  it("keeps logout disabled until integration", () => {
    render(<ProfileMenu />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open profile menu",
      })
    );

    expect(
      screen.getByRole("menuitem", {
        name: /sign out/i,
      })
    ).toBeDisabled();
  });
});
