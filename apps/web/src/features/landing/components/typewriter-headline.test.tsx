
/** @vitest-environment jsdom */

import type { ReactNode } from "react";

import {
  act,
  cleanup,
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

import { TypewriterHeadline } from "./typewriter-headline";

// ==========================================
// MOCK MOTION
// ==========================================

const { reducedMotionMock } = vi.hoisted(() => ({
  reducedMotionMock: vi.fn(() => false),
}));

vi.mock("motion/react", () => ({
  useReducedMotion: () => reducedMotionMock(),

  motion: {
    span: ({
      children,
      className,
      "aria-hidden": ariaHidden,
    }: {
      children: ReactNode;
      className?: string;
      "aria-hidden"?: boolean;
    }) => (
      <span
        className={className}
        aria-hidden={ariaHidden}
      >
        {children}
      </span>
    ),
  },
}));

// ==========================================
// TESTS
// ==========================================

describe("TypewriterHeadline", () => {
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

  it("renders an accessible heading", () => {
    render(<TypewriterHeadline />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Your job search, organized.",
      })
    ).toBeInTheDocument();
  });

  it("types one character at a time", () => {
    render(<TypewriterHeadline />);

    const typed = screen.getByTestId(
      "typed-phrase"
    );

    expect(typed).toHaveTextContent("");

    act(() => {
      vi.advanceTimersByTime(95);
    });

    expect(typed).toHaveTextContent("o");

    act(() => {
      vi.advanceTimersByTime(95);
    });

    expect(typed).toHaveTextContent("or");
  });

  it("cycles to the next phrase", () => {
    render(<TypewriterHeadline />);

    const typed = screen.getByTestId(
      "typed-phrase"
    );

    // Complete the first phrase.
    for (let i = 0; i < "organized.".length; i++) {
      act(() => {
        vi.advanceTimersByTime(95);
      });
    }

    expect(typed).toHaveTextContent("organized.");

    // Wait for the completed phrase.
    act(() => {
      vi.advanceTimersByTime(1700);
    });

    // Delete the first phrase.
    for (let i = 0; i < "organized.".length; i++) {
      act(() => {
        vi.advanceTimersByTime(55);
      });
    }

    // Switch phrase, then type two characters.
    act(() => {
      vi.advanceTimersByTime(300);
    });

    act(() => {
      vi.advanceTimersByTime(95);
    });

    act(() => {
      vi.advanceTimersByTime(95);
    });

    expect(typed).toHaveTextContent("on");
  });

  it("disables typewriter for reduced motion", () => {
    reducedMotionMock.mockReturnValue(true);

    render(<TypewriterHeadline />);

    const typed = screen.getByTestId(
      "typed-phrase"
    );

    expect(typed).toHaveTextContent("organized.");

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(typed).toHaveTextContent("organized.");
  });
});
