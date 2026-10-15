
"use client";

import { useSearchParams } from "next/navigation";

export function VerifiedNotice() {
  const searchParams = useSearchParams();

  if (searchParams.get("verified") !== "1") {
    return null;
  }

  return (
    <div
      role="status"
      className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-4"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary"
        >
          ✓
        </span>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Email verified successfully!
          </p>

          <p className="text-xs leading-6 text-muted-foreground">
            Your CareerTrack account is now active.
            Sign in to continue your journey.
          </p>
        </div>
      </div>
    </div>
  );
}
