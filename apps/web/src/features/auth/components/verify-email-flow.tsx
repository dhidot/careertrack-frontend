
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

type VerificationStatus =
  | "loading"
  | "success"
  | "missing"
  | "invalid"
  | "error";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const VERIFY_ENDPOINT = "/api/v1/auth/verify-email";
const LOGIN_SUCCESS_URL = "/login?verified=1";

function isSuccessfulResponse(body: unknown): boolean {
  return (
    typeof body === "object" &&
    body !== null &&
    "code" in body &&
    body.code === "200"
  );
}

export function VerifyEmailFlow() {
  const router = useRouter();

  const [status, setStatus] =
    useState<VerificationStatus>("loading");

  // Token is kept in memory only.
  const tokenRef = useRef<string | null>(null);

  // Prevent repeated initialization in Strict Mode.
  const startedRef = useRef(false);

  // Track whether component is mounted.
  const mountedRef = useRef(false);

  // Prevent concurrent verification requests.
  const inFlightRef = useRef(false);

  const verifyToken = useCallback(
    async (token: string) => {
      if (!mountedRef.current || inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;

      try {
        const response = await fetch(VERIFY_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify({ token }),
        });

        if (!mountedRef.current) {
          return;
        }

        if (response.status === 200) {
          const body: unknown = await response
            .json()
            .catch(() => null);

          if (!mountedRef.current) {
            return;
          }

          if (!isSuccessfulResponse(body)) {
            setStatus("error");
            return;
          }

          tokenRef.current = null;
          setStatus("success");

          router.replace(LOGIN_SUCCESS_URL);
          return;
        }

        if (response.status === 400) {
          tokenRef.current = null;
          setStatus("invalid");
          return;
        }

        setStatus("error");
      } catch {
        if (mountedRef.current) {
          setStatus("error");
        }
      } finally {
        inFlightRef.current = false;
      }
    },
    [router]
  );

  useEffect(() => {
    mountedRef.current = true;

    if (!startedRef.current) {
      startedRef.current = true;

      const fragment = window.location.hash;

      const params = new URLSearchParams(
        fragment.startsWith("#")
          ? fragment.slice(1)
          : fragment
      );

      const token = params.get("token");

      // Remove token from address bar immediately.
      if (fragment) {
        const cleanUrl =
          window.location.pathname +
          window.location.search;

        window.history.replaceState(
          window.history.state,
          "",
          cleanUrl
        );
      }

      // Schedule React state changes and network request
      // outside the synchronous effect execution.
      queueMicrotask(() => {
        if (!mountedRef.current) {
          return;
        }

        if (!token) {
          setStatus("missing");
          return;
        }

        if (!TOKEN_PATTERN.test(token)) {
          setStatus("invalid");
          return;
        }

        tokenRef.current = token;

        void verifyToken(token);
      });
    }

    return () => {
      mountedRef.current = false;
    };
  }, [verifyToken]);

  function handleRetry() {
    if (
      status !== "error" ||
      inFlightRef.current
    ) {
      return;
    }

    const token = tokenRef.current;

    if (!token) {
      return;
    }

    setStatus("loading");
    void verifyToken(token);
  }

  const isLoading = status === "loading";

  const isFailure =
    status === "missing" ||
    status === "invalid" ||
    status === "error";

  let title = "Verifying your email...";
  let description =
    "Please wait while we activate your CareerTrack account.";

  if (status === "success") {
    title = "Email verified successfully!";
    description =
      "Your account is now active. Redirecting you to sign in...";
  } else if (status === "missing") {
    title = "Verification token missing";
    description =
      "This link does not contain a verification token. Please open the original activation link from your email.";
  } else if (status === "invalid") {
    title = "Verification link unavailable";
    description =
      "This verification link is invalid, expired, or has already been used. Please check your email for a valid link.";
  } else if (status === "error") {
    title = "Unable to verify your email";
    description =
      "We could not confirm your verification right now. You can try again or check whether your account is already active by signing in.";
  }

  return (
    <section
      aria-label="Email verification status"
      aria-busy={isLoading}
      className="space-y-7"
    >
      <div
        aria-hidden="true"
        className={[
          "flex size-16 items-center justify-center rounded-2xl",
          status === "success"
            ? "bg-primary/10 text-primary"
            : isFailure
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary",
        ].join(" ")}
      >
        {isLoading ? (
          <span
            className={[
              "size-8 animate-spin rounded-full",
              "border-[3px] border-primary/20",
              "border-t-primary",
              "motion-reduce:animate-none",
            ].join(" ")}
          />
        ) : status === "success" ? (
          <span className="text-3xl font-bold">
            ✓
          </span>
        ) : (
          <span className="text-3xl font-bold">
            !
          </span>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">
          {title}
        </h2>

        <p
          role={isFailure ? "alert" : "status"}
          className="text-sm leading-7 text-muted-foreground"
        >
          {description}
        </p>
      </div>

      {status === "error" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Try verification again
          </button>

          <Link
            href="/login"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-border px-5 text-sm font-medium transition-colors hover:bg-secondary"
          >
            Try signing in
          </Link>
        </div>
      )}

      {(status === "missing" ||
        status === "invalid") && (
        <Link
          href="/login"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-border px-6 text-sm font-medium transition-colors hover:bg-secondary"
        >
          Back to login
        </Link>
      )}

      {status === "success" && (
        <p className="text-xs font-medium text-primary">
          Redirecting to login...
        </p>
      )}

      <div className="border-t border-border pt-5">
        <p className="text-xs leading-6 text-muted-foreground">
          For your security, verification links
          expire after 24 hours and can only
          be used once.
        </p>
      </div>
    </section>
  );
}
