
import type { ReactNode } from "react";

import { AuthProvider } from "@/features/auth/components/auth-provider";
import { PrivateRoute } from "@/features/auth/components/private-route";

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthProvider>
      <PrivateRoute>{children}</PrivateRoute>
    </AuthProvider>
  );
}
