"use client";

import { useAuth } from "@/features/auth/components/auth-provider";

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
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-border bg-background px-5 sm:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation-panel"
          onClick={onOpenMobile}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground hover:bg-muted lg:hidden"
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

        <div>
          <p className="text-xs text-muted-foreground">
            CareerTrack Workspace
          </p>
          <h1 className="text-lg font-semibold tracking-tight">
            Overview
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium">{username}</p>
          <p className="text-xs text-muted-foreground">
            Personal workspace
          </p>
        </div>

        <div
          aria-label={`${username} profile`}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-sm font-semibold text-secondary-foreground"
        >
          {initial}
        </div>
      </div>
    </header>
  );
}