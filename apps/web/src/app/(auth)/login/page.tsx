
import { Suspense } from "react";
import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/login-form";
import { VerifiedNotice } from "@/features/auth/components/verified-notice";

export const metadata: Metadata = {
  title: "Sign In | CareerTrack",
  description: "Sign in to your CareerTrack account.",
};

export default function LoginPage() {
  return (
    <div className="w-full">
      {/* ====================================
          PAGE HEADING
      ==================================== */}

      <div className="mb-9 space-y-3">
        <p className="text-xs font-semibold tracking-[0.16em] text-primary">
          WELCOME BACK — 02
        </p>

        <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          Welcome back
        </h1>

        <p className="text-sm leading-6 text-muted-foreground">
          Sign in to continue your journey.
        </p>
      </div>

      {/* ====================================
          VERIFICATION NOTICE + LOGIN FORM
      ==================================== */}

      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">
            Loading sign in...
          </p>
        }
      >
        <div className="space-y-4">
          <VerifiedNotice />
          <LoginForm />
        </div>
      </Suspense>
    </div>
  );
}
