import { DashboardSkeleton } from "./dashboard-skeleton";

export function SessionLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-label="Checking your CareerTrack session"
      className="min-h-screen bg-background text-foreground"
    >
      <div className="border-b border-foreground/10">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-foreground/15 bg-foreground/5"
            >
              <span className="h-4 w-4 animate-pulse rounded-md bg-foreground/60 motion-reduce:animate-none" />
            </div>

            <div>
              <p className="text-sm font-semibold tracking-wide">
                CareerTrack
              </p>
              <p className="text-xs text-muted-foreground">
                Your career workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              aria-hidden="true"
              className="h-2 w-2 animate-pulse rounded-full bg-foreground/60 motion-reduce:animate-none"
            />
            <span>Establishing session</span>
          </div>
        </div>
      </div>

      <DashboardSkeleton />

      <p className="sr-only">
        Your session is being verified. Please wait.
      </p>
    </main>
  );
}