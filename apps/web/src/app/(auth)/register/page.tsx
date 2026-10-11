
import Link from "next/link";
import type { Metadata } from "next";

import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your CareerTrack account.",
};

export default function RegisterPage() {
  return (
    <div className="w-full">
      <div className="mb-9 space-y-3">
        <p className="text-xs font-semibold tracking-[0.16em] text-primary">
          GET STARTED — 01
        </p>

        <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          Create your account
        </h2>

        <p className="text-sm leading-6 text-muted-foreground">
          One place for every opportunity ahead.
        </p>
      </div>

      <RegisterForm />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-foreground transition-colors hover:text-primary"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
