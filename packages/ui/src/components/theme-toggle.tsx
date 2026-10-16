
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => {
        if (!mounted) return;
        setTheme(isDark ? "light" : "dark");
      }}
      disabled={!mounted}
      aria-label={
        mounted
          ? `Switch to ${isDark ? "light" : "dark"} mode`
          : "Change color theme"
      }
      title={
        mounted
          ? `Switch to ${isDark ? "light" : "dark"} mode`
          : "Change color theme"
      }
      className="
        inline-flex h-10 w-10 shrink-0
        items-center justify-center
        rounded-xl border border-border
        bg-card text-foreground
        transition-colors duration-200
        hover:bg-muted
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-ring
        focus-visible:ring-offset-2
        focus-visible:ring-offset-background
        disabled:cursor-default
        disabled:opacity-60
      "
    >
      {!mounted ? (
        <span
          aria-hidden="true"
          className="h-5 w-5"
        />
      ) : isDark ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M20.985 12.486A9 9 0 0 1 11.514 3.015a9 9 0 1 0 9.47 9.47Z" />
        </svg>
      )}
    </button>
  );
}
