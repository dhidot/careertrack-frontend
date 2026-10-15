
"use client";

import { useAuth } from "@/features/auth/components/auth-provider";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold">
        CareerTrack Dashboard
      </h1>

      <p className="mt-4 text-muted-foreground">
        Welcome back, {user?.username}.
      </p>

      <p className="mt-2 text-sm text-muted-foreground">
        Your private workspace is ready.
      </p>
    </main>
  );
}
