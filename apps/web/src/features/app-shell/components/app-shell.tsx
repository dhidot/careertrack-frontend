import type { ReactNode } from "react";

import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />

        <main
          id="main-content"
          className="min-w-0 flex-1"
        >
          {children}
        </main>
      </div>
    </div>
  );
}