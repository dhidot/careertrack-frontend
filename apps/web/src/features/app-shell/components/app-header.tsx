"use client";

import { useAuth } from "@/features/auth/components/auth-provider";

export function AppHeader() {
  const { user } = useAuth();

  const username = user?.username ?? "User";
  const initial = username.charAt(0).toUpperCase();

  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-border bg-background px-5 sm:px-8">
      <div>
        <p className="text-xs text-muted-foreground">
          CareerTrack Workspace
        </p>

        <h1 className="text-lg font-semibold tracking-tight">
          Overview
        </h1>
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