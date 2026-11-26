
"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "@/features/auth/components/auth-provider";
import {
  signOut,
  type SignOutScope,
} from "@/features/auth/lib/session-client";
import { navigateToLogin } from "@/features/auth/lib/session-navigation";

const ERROR_MESSAGES = {
  "rate-limited": "Too many attempts. Please wait a moment and try again.",
  unavailable: "Couldn't sign out right now. Please try again.",
} as const;

export function ProfileMenu() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<SignOutScope | null>(null);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const logoutRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    setError(null);
  }

  async function handleSignOut(scope: SignOutScope) {
    if (pending) return;

    setPending(scope);
    setError(null);

    const result = await signOut(scope);

    if (result === "signed-out") {
      // Keep the pending state: the page is being replaced.
      navigateToLogin();
      return;
    }

    setPending(null);
    setError(ERROR_MESSAGES[result]);
  }

  // WAI-ARIA menu pattern: arrow keys move between items.
  function handleMenuKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>
  ) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }

    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not([disabled])'
      ) ?? []
    );

    if (items.length === 0) return;

    event.preventDefault();

    const current = items.indexOf(
      document.activeElement as HTMLButtonElement
    );
    const step = event.key === "ArrowDown" ? 1 : -1;
    const next = (current + step + items.length) % items.length;

    items[next]?.focus();
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
          ref={menuRef}
          id="careertrack-profile-menu"
          role="menu"
          aria-label="Profile actions"
          aria-busy={pending !== null}
          onKeyDown={handleMenuKeyDown}
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
            disabled={pending !== null}
            onClick={() => void handleSignOut("current")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:bg-destructive/10 focus-visible:outline-none disabled:opacity-60"
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
            {pending === "current" ? "Signing out…" : "Sign out"}
          </button>

          <button
            type="button"
            role="menuitem"
            disabled={pending !== null}
            onClick={() => void handleSignOut("all")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:outline-none disabled:opacity-60"
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
              <rect x="2" y="4" width="14" height="10" rx="2" />
              <path d="M8 18h4M10 14v4M19 8h3v10h-6" />
            </svg>
            {pending === "all"
              ? "Signing out everywhere…"
              : "Sign out of all devices"}
          </button>

          {error && (
            <p
              role="alert"
              className="px-3 pb-2 pt-1 text-xs text-destructive"
            >
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
