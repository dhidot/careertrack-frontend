"use client";

import { useAuth } from "@/features/auth/components/auth-provider";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Your workspace
        </p>

        <h2 className="text-3xl font-semibold tracking-tight">
          Welcome back, {user?.username}.
        </h2>

        <p className="text-sm text-muted-foreground">
          Keep track of your career journey in one place.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-8">
        <h3 className="text-lg font-semibold">
          Your dashboard is taking shape
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Application tracking and insights are coming soon.
        </p>
      </div>
    </section>
  );
}