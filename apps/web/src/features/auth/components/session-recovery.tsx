"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getSession } from "../lib/session-client";
import { SessionLoading } from "@/features/dashboard/components/session-loading";

import { navigateToDashboard } from "../lib/session-navigation";

type RecoveryStatus = "recovering" | "unavailable" | "forbidden";

export function SessionRecovery() {
  const router = useRouter();
  const [status, setStatus] = useState<RecoveryStatus>("recovering");

  useEffect(() => {
    let active = true;

    void getSession().then((result) => {
      if (!active) return;

      switch (result.status) {
        case "authenticated":
          // Full navigation ensures the server guard
          // reads the newly rotated HttpOnly cookies.
          navigateToDashboard();
          break;

        case "unauthenticated":
          router.replace("/login");
          break;

        case "forbidden":
          setStatus("forbidden");
          break;

        case "unavailable":
          setStatus("unavailable");
          break;
      }
    });

    return () => {
      active = false;
    };
  }, [router]);

  if (status === "recovering") {
    return <SessionLoading />;
  }

  if (status === "forbidden") {
    return (
      <main className="mx-auto max-w-xl px-6 py-20">
        <h1 className="text-2xl font-semibold">
          Access denied
        </h1>
        <p className="mt-3 text-muted-foreground">
          This account cannot access CareerTrack.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <h1 className="text-2xl font-semibold">
        Authentication unavailable
      </h1>
      <p className="mt-3 text-muted-foreground">
        We could not restore your session.
        Please try again later.
      </p>
    </main>
  );
}