"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";

type AppShellProps = {
  children: ReactNode;
};

const SIDEBAR_STORAGE_KEY = "careertrack.sidebar.collapsed";

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    try {
      setCollapsed(
        window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true"
      );
    } catch {
      // Continue with expanded sidebar when storage is unavailable.
    }
  }, []);

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
        collapsed={collapsed}
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