"use client";

import { useAuth } from "@/features/auth/components/auth-provider";
import { ThemeToggle } from "@careertrack/ui/components/theme-toggle";

type AppHeaderProps = {
  mobileOpen: boolean;
  onOpenMobile: () => void;
};

export function AppHeader({
  mobileOpen,
  onOpenMobile,
}: AppHeaderProps) {
  const { user } = useAuth();

  const username = user?.username ?? "User";
  const initial = username.charAt(0).toUpperCase();

  return (
    <header className="flex h-20 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6 lg:px-8">
      {/* Left: Navigation + Page Title */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation-panel"
          onClick={onOpenMobile}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-muted lg:hidden"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-5 w-5"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">
            CareerTrack Workspace
          </p>
          <h1 className="truncate text-lg font-semibold tracking-tight">
            Overview
          </h1>
        </div>
      </div>

      {/* Right: Appearance + User Profile */}
      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <ThemeToggle />

        {/* Visual separation */}
        <div
          aria-hidden="true"
          className="h-7 w-px bg-border"
        />

        {/* User information */}
        <div className="hidden min-w-0 text-right sm:block">
          <p className="max-w-36 truncate text-sm font-semibold text-foreground">
            {username}
          </p>
          <p className="text-xs text-muted-foreground">
            Personal workspace
          </p>
        </div>

        {/* User avatar */}
        <div
          aria-label={`${username} profile`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-sm font-semibold text-secondary-foreground"
        >
          {initial}
        </div>
      </div>
    </header>
  );
}