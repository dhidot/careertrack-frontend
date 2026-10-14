
/** @vitest-environment jsdom */

import type { ReactNode } from "react";

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { LandingPreview } from "./landing-preview";

// ==========================================
// MOTION MOCK
// ==========================================

const { reducedMotionMock } = vi.hoisted(() => ({
  reducedMotionMock: vi.fn(() => false),
}));

vi.mock("motion/react", () => ({
  useReducedMotion: () => reducedMotionMock(),

  AnimatePresence: ({
    children,
  }: {
    children: ReactNode;
  }) => <>{children}</>,

  motion: {
    div: ({
      children,
      className,
    }: {
      children?: ReactNode;
      className?: string;
    }) => (
      <div className={className}>
        {children}
      </div>
    ),

    span: ({
      children,
      className,
      "data-testid": testId,
    }: {
      children?: ReactNode;
      className?: string;
      "data-testid"?: string;
    }) => (
      <span
        className={className}
        data-testid={testId}
      >
        {children}
      </span>
    ),
  },
}));

// ==========================================
// LANDING PREVIEW TESTS
// ==========================================

describe("LandingPreview", () => {
  beforeEach(() => {
    vi.useFakeTimers();

    reducedMotionMock.mockReset();
    reducedMotionMock.mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();

    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders an illustrative dashboard", () => {
    render(<LandingPreview />);

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

  it("starts from Applied stage", () => {
    render(<LandingPreview />);

    expect(
      screen.getByTestId("demo-current-status")
    ).toHaveTextContent("Applied");

    expect(
      screen.getByRole("progressbar", {
        name: "Example application progress",
      })
    ).toHaveAttribute("aria-valuenow", "30");
  });

  it("automatically advances to Interview and Offer", () => {
    render(<LandingPreview />);

    act(() => {
      vi.advanceTimersByTime(3200);
    });

    expect(
      screen.getByTestId("demo-current-status")
    ).toHaveTextContent("Interview");

    act(() => {
      vi.advanceTimersByTime(3200);
    });

    expect(
      screen.getByTestId("demo-current-status")
    ).toHaveTextContent("Offer");
  });

  it("loops back to Applied", () => {
    render(<LandingPreview />);

    act(() => {
      vi.advanceTimersByTime(9600);
    });

    expect(
      screen.getByTestId("demo-current-status")
    ).toHaveTextContent("Applied");
  });

  it("pauses and resumes automatic transitions", () => {
    render(<LandingPreview />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Pause demo",
      })
    );

    act(() => {
      vi.advanceTimersByTime(6400);
    });

    expect(
      screen.getByTestId("demo-current-status")
    ).toHaveTextContent("Applied");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Play demo",
      })
    );

    act(() => {
      vi.advanceTimersByTime(3200);
    });

    expect(
      screen.getByTestId("demo-current-status")
    ).toHaveTextContent("Interview");
  });

  it("allows manual stage selection and stops autoplay", () => {
    render(<LandingPreview />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Show Offer stage",
      })
    );

    expect(
      screen.getByTestId("demo-current-status")
    ).toHaveTextContent("Offer");

    expect(
      screen.getByRole("button", {
        name: "Show Offer stage",
      })
    ).toHaveAttribute("aria-pressed", "true");

    act(() => {
      vi.advanceTimersByTime(6400);
    });

    expect(
      screen.getByTestId("demo-current-status")
    ).toHaveTextContent("Offer");
  });

  it("disables autoplay for reduced motion", () => {
    reducedMotionMock.mockReturnValue(true);

    render(<LandingPreview />);

    act(() => {
      vi.advanceTimersByTime(9600);
    });

    expect(
      screen.getByTestId("demo-current-status")
    ).toHaveTextContent("Applied");

    expect(
      screen.queryByRole("button", {
        name: "Pause demo",
      })
    ).not.toBeInTheDocument();

    // Manual navigation still works.
    fireEvent.click(
      screen.getByRole("button", {
        name: "Show Interview stage",
      })
    );

    expect(
      screen.getByTestId("demo-current-status")
    ).toHaveTextContent("Interview");
  });
});
