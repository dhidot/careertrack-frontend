"use client";

/**
 * Perform a full browser navigation so the next
 * server request reads the latest HttpOnly cookies.
 */
export function navigateToDashboard(): void {
  window.location.replace("/dashboard");
}
/**
 * Full navigation after logout: drops all in-memory
 * client state and lets the server guard re-evaluate
 * the (now cleared) cookies. `replace` keeps the private
 * page out of the back-button history.
 */
export function navigateToLogin(): void {
  window.location.replace("/login");
}
