
// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SessionLoading } from "./session-loading";

afterEach(() => {
  cleanup();
});

describe("SessionLoading", () => {
  it("renders an accessible workspace loading status", () => {
    render(<SessionLoading />);

    expect(
      screen.getByRole("status", {
        name: "Loading CareerTrack workspace",
      })
    ).toBeInTheDocument();
  });

  it("renders the workspace layout skeleton", () => {
    render(<SessionLoading />);

    expect(
      screen.getByRole("complementary")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("banner")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("main")
    ).toBeInTheDocument();
  });

  it("does not render private user information", () => {
    render(<SessionLoading />);

    expect(
      screen.queryByText(/welcome back/i)
    ).not.toBeInTheDocument();
  });
});
