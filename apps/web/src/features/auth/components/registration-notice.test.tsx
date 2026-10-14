
/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RegistrationNotice } from "./registration-notice";

const { searchParamsMock } = vi.hoisted(() => ({
  searchParamsMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsMock(),
}));

describe("RegistrationNotice", () => {
  beforeEach(() => {
    searchParamsMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows verification notice after successful registration", () => {
    searchParamsMock.mockReturnValue(
      new URLSearchParams("registered=1")
    );

    render(<RegistrationNotice />);

    expect(
      screen.getByText("Account created successfully!")
    ).toBeInTheDocument();

    expect(
      screen.getByText(/check your inbox or spam folder/i)
    ).toBeInTheDocument();
  });

  it("does not show registration notice on regular login", () => {
    searchParamsMock.mockReturnValue(
      new URLSearchParams()
    );

    render(<RegistrationNotice />);

    expect(
      screen.queryByRole("status")
    ).not.toBeInTheDocument();
  });
});
