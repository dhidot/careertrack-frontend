"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() =>
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
      }
      aria-label="Toggle color theme"
      className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
    >
      <span className="hidden dark:inline">
        ☀ Light mode
      </span>
      <span className="dark:hidden">
        ☾ Dark mode
      </span>
    </button>
  );
}