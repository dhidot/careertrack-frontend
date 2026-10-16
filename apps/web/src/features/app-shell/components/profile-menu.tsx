
"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "@/features/auth/components/auth-provider";

export function ProfileMenu() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const logoutRef = useRef<HTMLButtonElement>(null);

  const username = user?.username ?? "User";
  const email = user?.email ?? "";
  const initial = username.charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleToggle() {
    setOpen((previous) => !previous);
  }

  function handleTriggerKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>
  ) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => logoutRef.current?.focus());
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open profile menu"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? "careertrack-profile-menu" : undefined}
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        className="flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="hidden min-w-0 text-right sm:block">
          <p className="max-w-36 truncate text-sm font-semibold text-foreground">
            {username}
          </p>
          <p className="text-xs text-muted-foreground">
            Personal workspace
          </p>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-sm font-semibold text-secondary-foreground">
          {initial}
        </span>

        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`hidden h-4 w-4 text-muted-foreground transition-transform sm:block ${
            open ? "rotate-180" : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          id="careertrack-profile-menu"
          role="menu"
          aria-label="Profile actions"
          className="absolute right-0 top-full z-50 mt-3 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-xl shadow-black/10 dark:shadow-black/30"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
              {initial}
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {username}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {email}
              </p>
            </div>
          </div>

          <div className="my-1 h-px bg-border" />

          <button
            ref={logoutRef}
            type="button"
            role="menuitem"
            disabled
            title="Logout integration is coming in Sprint 2.2.2"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-destructive opacity-60"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5M21 12H9" />
            </svg>
            Sign out
            <span className="ml-auto text-xs font-normal">
              Soon
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
