"use client";

/**
 * Perform a full browser navigation so the next
 * server request reads the latest HttpOnly cookies.
 */
export function navigateToDashboard(): void {
  window.location.replace("/dashboard");
}