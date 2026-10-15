
/** @vitest-environment jsdom */

import {
  cleanup,
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

import { VerifiedNotice } from "./verified-notice";

// ==========================================
// MOCK SEARCH PARAMS
// ==========================================

const { searchParamsMock } = vi.hoisted(() => ({
  searchParamsMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsMock(),
}));

// ==========================================
// TESTS
// ==========================================

describe("VerifiedNotice", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows success notice when verified=1", () => {
    searchParamsMock.mockReturnValue(
      new URLSearchParams("verified=1")
    );

    render(<VerifiedNotice />);

    expect(
      screen.getByText(
        "Email verified successfully!"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("status")
    ).toBeInTheDocument();
  });

  it("does not display notice without verified=1", () => {
    searchParamsMock.mockReturnValue(
      new URLSearchParams()
    );

    render(<VerifiedNotice />);

    expect(
      screen.queryByText(
        "Email verified successfully!"
      )
    ).not.toBeInTheDocument();
  });

  it("does not confuse registration and verification notices", () => {
    searchParamsMock.mockReturnValue(
      new URLSearchParams("registered=1")
    );

    render(<VerifiedNotice />);

    expect(
      screen.queryByRole("status")
    ).not.toBeInTheDocument();
  });
});
