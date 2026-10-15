import { Suspense, type ReactNode } from "react";

import { AuthProvider } from "@/features/auth/components/auth-provider";
import { PrivateRoute } from "@/features/auth/components/private-route";
import { ServerSessionGuard } from "@/features/auth/components/server-session-guard";
import { SessionLoading } from "@/features/dashboard/components/session-loading";

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<SessionLoading />}>
      <ServerSessionGuard>
        <AuthProvider>
          <PrivateRoute>{children}</PrivateRoute>
        </AuthProvider>
      </ServerSessionGuard>
    </Suspense>
  );
}