// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  render,
  screen,
} from "@testing-library/react";

import { SessionLoading } from "./session-loading";

afterEach(() => {
  cleanup();
});

describe("SessionLoading", () => {
  it("renders an accessible loading status", () => {
    render(<SessionLoading />);

    expect(
      screen.getByRole("status", {
        name: "Checking your CareerTrack session",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Establishing session")
    ).toBeInTheDocument();
  });

  it("renders CareerTrack branding", () => {
    render(<SessionLoading />);

    expect(
      screen.getByText("CareerTrack")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Your career workspace")
    ).toBeInTheDocument();
  });

  it("does not render private user information", () => {
    render(<SessionLoading />);

    expect(
      screen.queryByText(/welcome back/i)
    ).not.toBeInTheDocument();
  });
});