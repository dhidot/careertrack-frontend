// @vitest-environment jsdom

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
} from "vitest";

import {
  dashboardMock,
  emptyDashboardMock,
} from "../data/dashboard-mock";
import { DashboardOverview } from "./dashboard-overview";

afterEach(() => {
  cleanup();
});

describe("DashboardOverview", () => {
  it("renders the user's welcome message", () => {
    render(
      <DashboardOverview data={dashboardMock} username="didot" />
    );

    expect(
      screen.getByText("Welcome back, didot")
    ).toBeInTheDocument();
  });

  it("renders summary metrics", () => {
    render(<DashboardOverview data={dashboardMock} />);

    expect(screen.getByText("Total Applications")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Interviews")).toBeInTheDocument();
    expect(screen.getByText("Offers")).toBeInTheDocument();
  });

  it("renders pipeline stages", () => {
    render(<DashboardOverview data={dashboardMock} />);

    expect(
      screen.getByRole("progressbar", {
        name: "Applied applications",
      })
    ).toHaveAttribute("aria-valuenow", "1");

    expect(
      screen.getByRole("progressbar", {
        name: "Interview applications",
      })
    ).toHaveAttribute("aria-valuenow", "1");
  });

  it("renders recent applications", () => {
    render(<DashboardOverview data={dashboardMock} />);

    expect(screen.getByText("Example Company")).toBeInTheDocument();
    expect(screen.getByText("Demo Labs")).toBeInTheDocument();
  });

  it("renders empty state when no applications exist", () => {
    render(<DashboardOverview data={emptyDashboardMock} />);

    expect(
      screen.getByTestId("dashboard-empty-state")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Your journey starts here")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Application pipeline")
    ).not.toBeInTheDocument();
  });

  it("keeps add application disabled until backend is ready", () => {
    render(<DashboardOverview data={dashboardMock} />);

    expect(
      screen.getByRole("button", {
        name: /add application/i,
      })
    ).toBeDisabled();
  });
});