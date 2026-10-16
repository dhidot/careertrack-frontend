
"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";

type AppShellProps = {
  children: ReactNode;
};

const SIDEBAR_STORAGE_KEY = "careertrack.sidebar.collapsed";

const subscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return (
      window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true"
    );
  } catch {
    return false;
  }
}

export function AppShell({ children }: AppShellProps) {
  const isClient = useIsClient();

  const [collapsed, setCollapsed] = useState(
    getInitialCollapsed
  );

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const toggleSidebar = () => {
    setCollapsed((previous) => {
      const next = !previous;

      try {
        window.localStorage.setItem(
          SIDEBAR_STORAGE_KEY,
          String(next)
        );
      } catch {
        // Sidebar remains functional without persistence.
      }

      return next;
    });
  };

  const closeMobile = () => {
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar
        collapsed={isClient ? collapsed : false}
        onToggle={toggleSidebar}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          mobileOpen={mobileOpen}
          onOpenMobile={() => setMobileOpen(true)}
        />

        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
