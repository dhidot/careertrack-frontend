// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { DashboardSkeleton } from "./dashboard-skeleton";

describe("DashboardSkeleton", () => {
  it("renders a decorative dashboard placeholder", () => {
    const { container } = render(<DashboardSkeleton />);

    const skeleton = container.firstElementChild;

    expect(skeleton).not.toBeNull();
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
  });

  it("renders three metric placeholders", () => {
    const { container } = render(<DashboardSkeleton />);

    const metricCards = container.querySelectorAll(
      '[data-testid="metric-skeleton"]'
    );

    expect(metricCards).toHaveLength(3);
  });

  it("supports reduced motion", () => {
    const { container } = render(<DashboardSkeleton />);

    const animatedElements =
      container.querySelectorAll(".animate-pulse");

    expect(animatedElements.length).toBeGreaterThan(0);

    animatedElements.forEach((element) => {
      expect(element).toHaveClass(
        "motion-reduce:animate-none"
      );
    });
  });
});