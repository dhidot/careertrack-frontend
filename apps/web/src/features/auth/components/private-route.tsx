
"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "./auth-provider";

export function PrivateRoute({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <p>Checking your session...</p>;
  }

  if (status === "unavailable") {
    return (
      <div role="alert">
        Authentication service is temporarily unavailable.
        Please try again later.
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div role="alert">
        You do not have permission to access CareerTrack.
      </div>
    );
  }

  if (status !== "authenticated") {
    return null;
  }

  return <>{children}</>;
}
