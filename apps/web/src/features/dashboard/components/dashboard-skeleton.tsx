export function DashboardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto w-full max-w-6xl space-y-8 px-5 py-8 sm:px-8"
    >
      <div className="space-y-3">
        <div className="h-3 w-28 animate-pulse rounded-full bg-foreground/10 motion-reduce:animate-none" />
        <div className="h-9 w-64 max-w-full animate-pulse rounded-xl bg-foreground/10 motion-reduce:animate-none" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-full bg-foreground/10 motion-reduce:animate-none" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            data-testid="metric-skeleton"
            className="space-y-5 rounded-2xl border border-foreground/10 bg-foreground/[0.025] p-6"
          >
            <div className="h-10 w-10 animate-pulse rounded-xl bg-foreground/10 motion-reduce:animate-none" />
            <div className="h-8 w-20 animate-pulse rounded-lg bg-foreground/10 motion-reduce:animate-none" />
            <div className="h-3 w-32 animate-pulse rounded-full bg-foreground/10 motion-reduce:animate-none" />
          </div>
        ))}
      </div>

      <div className="space-y-5 rounded-2xl border border-foreground/10 bg-foreground/[0.025] p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="h-5 w-40 animate-pulse rounded-lg bg-foreground/10 motion-reduce:animate-none" />
          <div className="h-8 w-20 animate-pulse rounded-lg bg-foreground/10 motion-reduce:animate-none" />
        </div>

        <div className="flex h-48 items-end gap-3">
          {[38, 60, 45, 75, 56, 88, 65, 95, 72, 84].map(
            (height, index) => (
              <div
                key={index}
                className="flex-1 animate-pulse rounded-t-lg bg-foreground/10 motion-reduce:animate-none"
                style={{ height: `${height}%` }}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}