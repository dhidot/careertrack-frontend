
// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  DashboardContentSkeleton,
  DashboardSkeleton,
} from "./dashboard-skeleton";

afterEach(() => {
  cleanup();
});

describe("DashboardSkeleton", () => {
  it("renders an accessible loading status", () => {
    render(<DashboardSkeleton />);

    expect(
      screen.getByRole("status", {
        name: "Loading CareerTrack workspace",
      })
    ).toBeInTheDocument();
  });

  it("renders sidebar, header, and dashboard content", () => {
    render(<DashboardSkeleton />);

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

  it("renders four summary metric placeholders", () => {
    const { container } = render(<DashboardContentSkeleton />);

    const metricGrid = container.querySelector(
      ".grid.grid-cols-2.lg\\:grid-cols-4"
    );

    expect(metricGrid).not.toBeNull();
    expect(metricGrid?.children).toHaveLength(4);
  });

  it("supports reduced motion", () => {
    const { container } = render(<DashboardSkeleton />);

    const animatedElements = container.querySelectorAll(
      ".animate-pulse"
    );

    expect(animatedElements.length).toBeGreaterThan(0);

    animatedElements.forEach((element) => {
      expect(element).toHaveClass(
        "motion-reduce:animate-none"
      );
    });
  });

  it("does not expose private user information", () => {
    render(<DashboardSkeleton />);

    expect(
      screen.queryByText(/welcome back/i)
    ).not.toBeInTheDocument();
  });
});
