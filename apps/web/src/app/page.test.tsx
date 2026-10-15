
/** @vitest-environment jsdom */

import {
  cleanup,
  render,
  screen,
  within,
} from "@testing-library/react";

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import HomePage from "./page";

vi.mock(
  "@careertrack/ui/components/theme-toggle",
  () => ({
    ThemeToggle: () => (
      <button
        type="button"
        aria-label="Toggle color theme"
      >
        Toggle theme
      </button>
    ),
  })
);

describe("CareerTrack Landing Page", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the main hero heading", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /your job search/i,
      })
    ).toBeInTheDocument();
  });

  it("provides registration navigation", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("link", {
        name: /get started/i,
      })
    ).toHaveAttribute("href", "/register");

    expect(
      screen.getByRole("link", {
        name: /start tracking/i,
      })
    ).toHaveAttribute("href", "/register");

    expect(
      screen.getByRole("link", {
        name: /create your account/i,
      })
    ).toHaveAttribute("href", "/register");
  });

  it("provides login navigation", () => {
    render(<HomePage />);

    const navigation = screen.getByRole(
      "navigation",
      {
        name: "Main navigation",
      }
    );

    expect(
      within(navigation).getByRole("link", {
        name: "Sign in",
      })
    ).toHaveAttribute("href", "/login");
  });

  it("provides working section navigation", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("link", {
        name: /explore features/i,
      })
    ).toHaveAttribute("href", "#features");

    expect(
      document.getElementById("features")
    ).toBeInTheDocument();

    expect(
      document.getElementById("how-it-works")
    ).toBeInTheDocument();
  });

  it("renders three feature cards", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "Everything in one place.",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "See where you stand.",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Make your next move.",
      })
    ).toBeInTheDocument();
  });

  it("labels dashboard data as illustrative", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("region", {
        name: "Illustrative application dashboard",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /illustrative product preview with example data/i
      )
    ).toBeInTheDocument();
  });

  it("includes the existing theme toggle", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("button", {
        name: "Toggle color theme",
      })
    ).toBeInTheDocument();
  });
});
