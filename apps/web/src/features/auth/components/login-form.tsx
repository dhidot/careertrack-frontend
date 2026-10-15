
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@careertrack/ui/components/button";
import { Input } from "@careertrack/ui/components/input";
import { Label } from "@careertrack/ui/components/label";

import {
  loginSchema,
  type LoginFormValues,
} from "../schemas/login-schema";

import { RegistrationNotice } from "./registration-notice";

// ==========================================
// INPUT STYLING
// ==========================================

const baseInputClassName = [
  "h-11 w-full rounded-lg border bg-muted/50 px-4",
  "text-sm text-foreground",
  "placeholder:text-muted-foreground/60",
  "transition-colors duration-200",
  "focus-visible:ring-2",
].join(" ");

function getInputClassName(hasError: boolean) {
  const stateClassName = hasError
    ? [
        "border-destructive",
        "hover:border-destructive",
        "focus-visible:border-destructive",
        "focus-visible:ring-destructive/25",
      ].join(" ")
    : [
        "border-border/70",
        "hover:border-border",
        "focus-visible:border-primary",
        "focus-visible:ring-primary/20",
      ].join(" ");

  return `${baseInputClassName} ${stateClassName}`;
}

// ==========================================
// API RESPONSE HELPER
// ==========================================

function getResponseMessage(body: unknown): string | null {
  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }

  return null;
}

// ==========================================
// LOGIN FORM
// ==========================================

export function LoginForm() {
  const router = useRouter();

  // ========================================
  // COMPONENT STATES
  // ========================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [serverError, setServerError] =
    useState<string | null>(null);

  // ========================================
  // REACT HOOK FORM
  // ========================================

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    reValidateMode: "onChange",

    defaultValues: {
      email: "",
      password: "",
    },
  });

  // ========================================
  // CLEAR ERROR ON HISTORY NAVIGATION
  // ========================================

  useEffect(() => {
    const clearStaleError = () => {
      setServerError(null);
    };

    window.addEventListener(
      "popstate",
      clearStaleError
    );

    window.addEventListener(
      "pageshow",
      clearStaleError
    );

    return () => {
      window.removeEventListener(
        "popstate",
        clearStaleError
      );

      window.removeEventListener(
        "pageshow",
        clearStaleError
      );
    };
  }, []);

  // ========================================
  // CLEAR TRANSIENT FORM STATE
  // ========================================

  function clearTransientState() {
    setServerError(null);
    setShowPassword(false);

    reset({
      email: "",
      password: "",
    });
  }

  // ========================================
  // SUBMIT LOGIN TO NEXT.JS BFF
  // ========================================

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);

    try {
      const response = await fetch(
        "/api/v1/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "same-origin",

          body: JSON.stringify({
            email: values.email,
            password: values.password,
          }),

          cache: "no-store",
        }
      );

      const result: unknown = await response
        .json()
        .catch(() => null);

      // ====================================
      // LOGIN SUCCESS
      // ====================================

      if (response.ok && response.status === 200) {
        // JWT is handled by the Next.js BFF
        // using HttpOnly cookies.
        // Never store tokens in localStorage.

        reset({
          email: values.email,
          password: "",
        });

        // Navigate to private dashboard.
        // AuthProvider validates the session
        // before rendering dashboard content.
        router.replace("/dashboard");

        return;
      }

      // ====================================
      // UNEXPECTED SUCCESS RESPONSE
      // ====================================

      if (response.ok) {
        setServerError(
          "Unexpected login response. Please try again."
        );

        return;
      }

      // ====================================
      // LOGIN ERROR
      // ====================================

      setServerError(
        getResponseMessage(result) ??
          "Sign in failed. Please try again."
      );
    } catch {
      setServerError(
        "Unable to connect to the server. Please try again."
      );
    }
  }

  // ========================================
  // LOGIN FORM VIEW
  // ========================================

  return (
    <div className="space-y-6">
      <RegistrationNotice />

      <form
        onSubmit={handleSubmit(onSubmit)}
        onChange={() => {
          setServerError(null);
        }}
        noValidate
        className="space-y-5"
      >
        {/* ==================================
            EMAIL
        ================================== */}

        <div className="space-y-2">
          <Label htmlFor="login-email">
            Email address
          </Label>

          <Input
            id="login-email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            disabled={isSubmitting}
            className={getInputClassName(
              !!errors.email
            )}
            aria-invalid={!!errors.email}
            aria-describedby={
              errors.email
                ? "login-email-error"
                : undefined
            }
            {...register("email")}
          />

          {errors.email && (
            <p
              id="login-email-error"
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        {/* ==================================
            PASSWORD
        ================================== */}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">
              Password
            </Label>

            <span className="text-xs text-muted-foreground">
              Forgot password?
            </span>
          </div>

          <div className="relative">
            <Input
              id="login-password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isSubmitting}
              className={`${getInputClassName(
                !!errors.password
              )} pr-16`}
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password
                  ? "login-password-error"
                  : undefined
              }
              {...register("password")}
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (previous) => !previous
                )
              }
              disabled={isSubmitting}
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
            >
              {showPassword
                ? "Hide"
                : "Show"}
            </button>
          </div>

          {errors.password && (
            <p
              id="login-password-error"
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        {/* ==================================
            SUBMIT BUTTON
        ================================== */}

        <Button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="mt-7 h-12 w-full rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 disabled:opacity-60"
        >
          <span>
            {isSubmitting
              ? "Signing in..."
              : "Sign in"}
          </span>

          <span aria-hidden="true">
            {isSubmitting
              ? "…"
              : "↗"}
          </span>
        </Button>

        {/* ==================================
            BACKEND ERROR
        ================================== */}

        {serverError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive"
          >
            <div className="flex items-start gap-2">
              <span aria-hidden="true">!</span>
              <span>{serverError}</span>
            </div>
          </div>
        )}
      </form>

      {/* ====================================
          CREATE ACCOUNT NAVIGATION
      ==================================== */}

      <p className="pt-2 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          onClick={clearTransientState}
          className="font-semibold text-foreground transition-colors hover:text-primary"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}
