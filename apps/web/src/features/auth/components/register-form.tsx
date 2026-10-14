
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@careertrack/ui/components/button";
import { Input } from "@careertrack/ui/components/input";
import { Label } from "@careertrack/ui/components/label";

import {
  registerSchema,
  type RegisterFormValues,
} from "../schemas/register-schema";

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
// FIELD ERROR COMPONENT
// ==========================================

type FieldErrorProps = {
  id: string;
  message?: string;
};

function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      className="flex items-start gap-2 text-xs font-medium leading-relaxed text-destructive"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-destructive/60 text-[10px] font-bold"
      >
        !
      </span>

      <span>{message}</span>
    </p>
  );
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
// REGISTER FORM
// ==========================================

export function RegisterForm() {
  const router = useRouter();

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // Backend response state
  const [serverError, setServerError] = useState<
    string | null
  >(null);

  // ========================================
  // REACT HOOK FORM
  // ========================================

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    reValidateMode: "onChange",

    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // ========================================
  // SUBMIT TO NEXT.JS BFF
  // ========================================

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);

    // Match Spring Boot RegisterRequest DTO.
    // Do not send confirmPassword or role.
    const payload = {
      username: values.username,
      email: values.email,
      password: values.password,
    };

    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),

        cache: "no-store",
      });

      const result: unknown = await response
        .json()
        .catch(() => null);

      const message = getResponseMessage(result);

      // Handle backend / BFF errors
      if (!response.ok) {
        setServerError(
          message ??
            "Registration failed. Please try again."
        );
        return;
      }

      // Expect 201 Created from Auth Service.
      if (response.status !== 201) {
        setServerError(
          "Unexpected registration response. Please try again."
        );
        return;
      }

      // ====================================
      // REGISTRATION SUCCESS
      // ====================================

      // Account remains PENDING_VERIFICATION.
      // No automatic login or session creation.

      // Clear sensitive form values.
      reset();

      // Redirect to Login with a success notice.
      router.replace("/login?registered=1");
    } catch {
      setServerError(
        "Unable to connect to the server. Please try again."
      );
    }
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onChange={() => {
        setServerError(null);
      }}
      noValidate
      className="space-y-5"
    >
      {/* =====================================
          USERNAME
      ===================================== */}

      <div className="space-y-2">
        <Label htmlFor="username">
          Username
        </Label>

        <Input
          id="username"
          type="text"
          placeholder="Enter your username"
          autoComplete="username"
          maxLength={50}
          disabled={isSubmitting}
          className={getInputClassName(
            !!errors.username
          )}
          aria-invalid={!!errors.username}
          aria-describedby={
            errors.username
              ? "username-error"
              : undefined
          }
          {...register("username")}
        />

        <FieldError
          id="username-error"
          message={errors.username?.message}
        />
      </div>

      {/* =====================================
          EMAIL ADDRESS
      ===================================== */}

      <div className="space-y-2">
        <Label htmlFor="email">
          Email address
        </Label>

        <Input
          id="email"
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
              ? "email-error"
              : undefined
          }
          {...register("email")}
        />

        <FieldError
          id="email-error"
          message={errors.email?.message}
        />
      </div>

      {/* =====================================
          PASSWORD
      ===================================== */}

      <div className="space-y-2">
        <Label htmlFor="password">
          Password
        </Label>

        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            autoComplete="new-password"
            maxLength={100}
            disabled={isSubmitting}
            className={`${getInputClassName(
              !!errors.password
            )} pr-16`}
            aria-invalid={!!errors.password}
            aria-describedby={
              errors.password
                ? "password-hint password-error"
                : "password-hint"
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
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
            aria-pressed={showPassword}
            disabled={isSubmitting}
            className="absolute inset-y-0 right-3 flex items-center justify-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <p
          id="password-hint"
          className="text-xs leading-relaxed text-muted-foreground"
        >
          Use 8–100 characters with uppercase,
          lowercase, and a number.
        </p>

        <FieldError
          id="password-error"
          message={errors.password?.message}
        />
      </div>

      {/* =====================================
          CONFIRM PASSWORD
      ===================================== */}

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          Confirm password
        </Label>

        <div className="relative">
          <Input
            id="confirmPassword"
            type={
              showConfirmPassword
                ? "text"
                : "password"
            }
            placeholder="Repeat your password"
            autoComplete="new-password"
            disabled={isSubmitting}
            className={`${getInputClassName(
              !!errors.confirmPassword
            )} pr-16`}
            aria-invalid={
              !!errors.confirmPassword
            }
            aria-describedby={
              errors.confirmPassword
                ? "confirmPassword-error"
                : undefined
            }
            {...register("confirmPassword")}
          />

          <button
            type="button"
            onClick={() =>
              setShowConfirmPassword(
                (previous) => !previous
              )
            }
            aria-label={
              showConfirmPassword
                ? "Hide confirmation password"
                : "Show confirmation password"
            }
            aria-pressed={showConfirmPassword}
            disabled={isSubmitting}
            className="absolute inset-y-0 right-3 flex items-center justify-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
          >
            {showConfirmPassword
              ? "Hide"
              : "Show"}
          </button>
        </div>

        <FieldError
          id="confirmPassword-error"
          message={errors.confirmPassword?.message}
        />
      </div>

      {/* =====================================
          SUBMIT BUTTON
      ===================================== */}

      <Button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="mt-7 h-12 w-full rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>
          {isSubmitting
            ? "Creating account..."
            : "Create account"}
        </span>

        <span aria-hidden="true">
          {isSubmitting ? "…" : "↗"}
        </span>
      </Button>

      {/* =====================================
          BACKEND ERROR
      ===================================== */}

      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm leading-relaxed text-destructive"
        >
          <div className="flex items-start gap-2">
            <span aria-hidden="true">!</span>
            <span>{serverError}</span>
          </div>
        </div>
      )}
    </form>
  );
}
