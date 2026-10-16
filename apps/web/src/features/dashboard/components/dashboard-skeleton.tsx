
type SkeletonBlockProps = {
  className?: string;
};

function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse motion-reduce:animate-none rounded-lg bg-muted ${className}`}
    />
  );
}

export function DashboardContentSkeleton() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 sm:px-8">
      {/* Dashboard greeting */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="h-8 w-64 max-w-full sm:w-80" />
          <SkeletonBlock className="h-4 w-72 max-w-full" />
        </div>

        <SkeletonBlock className="h-7 w-24 rounded-full" />
      </div>

      {/* Summary metrics: 2 columns mobile, 4 desktop */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <SkeletonBlock className="h-4 w-24 max-w-full" />
            <SkeletonBlock className="mt-4 h-9 w-14" />
          </div>
        ))}
      </div>

      {/* Pipeline + Recent applications */}
      <div className="grid gap-5 xl:grid-cols-5">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 xl:col-span-2">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="mt-3 h-4 w-52 max-w-full" />

          <div className="mt-7 space-y-6">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between gap-4">
                  <SkeletonBlock className="h-4 w-20" />
                  <SkeletonBlock className="h-4 w-6" />
                </div>
                <SkeletonBlock className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>

          <SkeletonBlock className="mt-7 h-3 w-56 max-w-full" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 xl:col-span-3">
          <div className="flex justify-between gap-4">
            <div className="space-y-3">
              <SkeletonBlock className="h-5 w-40" />
              <SkeletonBlock className="h-4 w-48 max-w-full" />
            </div>
            <SkeletonBlock className="h-7 w-16" />
          </div>

          <div className="mt-5 divide-y divide-border">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="space-y-2">
                  <SkeletonBlock className="h-4 w-40 max-w-full" />
                  <SkeletonBlock className="h-3 w-28" />
                  <SkeletonBlock className="h-3 w-24" />
                </div>
                <SkeletonBlock className="h-7 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick action */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-56 max-w-full" />
          <SkeletonBlock className="h-3 w-72 max-w-full" />
        </div>
        <SkeletonBlock className="h-10 w-36 rounded-xl" />
      </div>
    </section>
  );
}

export function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading CareerTrack workspace"
      className="flex min-h-screen bg-background text-foreground"
    >
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card px-4 py-6 lg:block">
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <SkeletonBlock className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-3 w-20" />
            </div>
          </div>

          <div className="space-y-3">
            <SkeletonBlock className="mx-2 h-3 w-20" />
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonBlock
                key={index}
                className="h-11 w-full rounded-xl"
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Header + Dashboard */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10 rounded-xl lg:hidden" />
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-36" />
              <SkeletonBlock className="h-5 w-24" />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <SkeletonBlock className="h-10 w-10 rounded-xl" />
            <div className="h-7 w-px bg-border" />
            <div className="hidden space-y-2 sm:block">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-3 w-28" />
            </div>
            <SkeletonBlock className="h-10 w-10 rounded-full" />
          </div>
        </header>

        <main className="min-w-0 flex-1">
          <DashboardContentSkeleton />
        </main>
      </div>

      <span className="sr-only">
        Loading your workspace, please wait.
      </span>
    </div>
  );
}
