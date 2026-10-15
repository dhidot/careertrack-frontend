
import type { Metadata } from "next";

import { VerifyEmailFlow } from "@/features/auth/components/verify-email-flow";

export const metadata: Metadata = {
  title: "Verify Email | CareerTrack",
  description:
    "Verify your email address to activate your CareerTrack account.",
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

export default function VerifyEmailPage() {
  return (
    <div className="w-full">
      {/* ====================================
          PAGE HEADER
      ==================================== */}

      <div className="mb-9 space-y-3">
        <p className="text-xs font-semibold tracking-[0.16em] text-primary">
          ACCOUNT ACTIVATION — 03
        </p>

        <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          One step closer.
        </h1>

        <p className="max-w-md text-sm leading-7 text-muted-foreground">
          Complete your email verification to
          activate your CareerTrack account.
        </p>
      </div>

      {/* ====================================
          AUTOMATIC VERIFICATION
      ==================================== */}

      <VerifyEmailFlow />
    </div>
  );
}
