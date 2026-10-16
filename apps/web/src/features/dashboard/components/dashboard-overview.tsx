
import type {
  ApplicationStatus,
  DashboardData,
} from "../types/dashboard";

type DashboardOverviewProps = {
  data: DashboardData;
  username?: string;
};

const statusLabels: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const pipelineStatuses: ApplicationStatus[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
];

export function DashboardOverview({
  data,
  username = "there",
}: DashboardOverviewProps) {
  const applications = data.applications;

  const countByStatus = (status: ApplicationStatus) =>
    applications.filter((application) => application.status === status)
      .length;

  const total = applications.length;
  const inProgress = applications.filter((application) =>
    ["APPLIED", "SCREENING", "INTERVIEW"].includes(application.status)
  ).length;
  const interviews = countByStatus("INTERVIEW");
  const offers = countByStatus("OFFER");

  const summary = [
    { label: "Total Applications", value: total },
    { label: "In Progress", value: inProgress },
    { label: "Interviews", value: interviews },
    { label: "Offers", value: offers },
  ];

  const recentApplications = [...applications]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  const maxPipelineCount = Math.max(
    1,
    ...pipelineStatuses.map(countByStatus)
  );

  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Welcome back, {username}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Your application overview
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Keep track of your opportunities and progress in one place.
          </p>
        </div>

        <span className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
          Demo data
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">
              {item.label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {total === 0 ? (
        <div
          data-testid="dashboard-empty-state"
          className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-7 w-7"
            >
              <rect x="3" y="6" width="18" height="15" rx="2" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
            </svg>
          </div>

          <h3 className="mt-5 text-xl font-semibold">
            Your journey starts here
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Once you add your first job application, your pipeline and
            recent activity will appear here.
          </p>

          <button
            type="button"
            disabled
            title="Application management is coming soon"
            className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground opacity-60"
          >
            Add application — Coming soon
          </button>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-5">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 xl:col-span-2">
            <div>
              <h3 className="text-base font-semibold">
                Application pipeline
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Current applications by stage
              </p>
            </div>

            <div className="mt-7 space-y-6">
              {pipelineStatuses.map((status) => {
                const count = countByStatus(status);
                const percentage = (count / maxPipelineCount) * 100;

                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{statusLabels[status]}</span>
                      <span className="font-medium tabular-nums">
                        {count}
                      </span>
                    </div>

                    <div
                      role="progressbar"
                      aria-label={`${statusLabels[status]} applications`}
                      aria-valuemin={0}
                      aria-valuemax={maxPipelineCount}
                      aria-valuenow={count}
                      className="h-2 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-[width]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-7 text-xs text-muted-foreground">
              Rejected applications are excluded from the active pipeline.
            </p>
          </section>

          <section className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6 xl:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">
                  Recent applications
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your latest application updates
                </p>
              </div>

              <span className="rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                Latest 5
              </span>
            </div>

            <div className="mt-5 divide-y divide-border">
              {recentApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {application.position}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {application.company}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Updated {application.updatedAt}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                    {statusLabels[application.status]}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
        <div>
          <h3 className="text-sm font-semibold">
            Ready for your next opportunity?
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Application management will be available in an upcoming sprint.
          </p>
        </div>

        <button
          type="button"
          disabled
          title="Coming soon"
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground opacity-60"
        >
          + Add application
        </button>
      </div>
    </section>
  );
}
