
"use client";

import { useSearchParams } from "next/navigation";

export function RegistrationNotice() {
  const searchParams = useSearchParams();

  const isRegistered =
    searchParams.get("registered") === "1";

  if (!isRegistered) {
    return null;
  }

  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-primary/30 bg-primary/10 p-4"
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
        >
          ✓
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">
            Account created successfully!
          </p>

          <p className="text-sm leading-6 text-muted-foreground">
            Your account is pending email verification.
            Please check your inbox or spam folder
            and follow the activation link before
            signing in.
          </p>
        </div>
      </div>
    </div>
  );
}
