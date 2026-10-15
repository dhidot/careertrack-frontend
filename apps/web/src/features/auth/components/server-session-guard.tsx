import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getServerSession } from "../lib/session-server";

type Props = {
  children: ReactNode;
};

export async function ServerSessionGuard({
  children,
}: Props) {
  const session = await getServerSession();

  if (session.status === "unauthenticated") {
    redirect("/session/recover?next=%2Fdashboard");
  }

  if (session.status === "forbidden") {
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

  if (session.status === "unavailable") {
    return (
      <main className="mx-auto max-w-xl px-6 py-20">
        <h1 className="text-2xl font-semibold">
          Authentication unavailable
        </h1>
        <p className="mt-3 text-muted-foreground">
          We could not verify your session.
          Please try again later.
        </p>
      </main>
    );
  }

  return <>{children}</>;
}