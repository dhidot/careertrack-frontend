"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AppSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

const navigation = [
  { label: "Overview", href: "/dashboard", icon: "overview", enabled: true },
  { label: "Applications", href: "/applications", icon: "applications", enabled: false },
  { label: "Interviews", href: "/interviews", icon: "interviews", enabled: false },
  { label: "Analytics", href: "/analytics", icon: "analytics", enabled: false },
] as const;

type IconName = (typeof navigation)[number]["icon"];

function NavIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    applications: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" />
      </>
    ),
    interviews: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 11h18M8 15h3M8 18h6" />
      </>
    ),
    analytics: (
      <>
        <path d="M4 20V12M10 20V4M16 20v-8M22 20V8M2 20h22" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
    >
      {paths[name]}
    </svg>
  );
}

export function AppSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}: AppSidebarProps) {
  const pathname = usePathname();

  const navContent = (compact: boolean, mobile: boolean) => (
    <nav
      aria-label={mobile ? "Mobile navigation" : "Main navigation"}
      className="flex-1 space-y-1.5 p-3"
    >
      {navigation.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" &&
            pathname.startsWith(`${item.href}/`));

        const classes = [
          "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
          compact ? "justify-center" : "",
          active
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        ].join(" ");

        const content = (
          <>
            <NavIcon name={item.icon} />
            {!compact && <span className="truncate">{item.label}</span>}
            {!compact && !item.enabled && (
              <span className="ml-auto text-[10px] font-normal opacity-60">
                Soon
              </span>
            )}
          </>
        );

        if (!item.enabled) {
          return (
            <span
              key={item.href}
              aria-disabled="true"
              aria-label={item.label}
              title={compact ? `${item.label} — Coming soon` : undefined}
              className={`${classes} cursor-not-allowed opacity-50`}
            >
              {content}
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            title={compact ? item.label : undefined}
            onClick={mobile ? onCloseMobile : undefined}
            className={classes}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (compact: boolean) => (
    <Link
      href="/dashboard"
      aria-label="CareerTrack home"
      onClick={onCloseMobile}
      className="flex h-20 items-center justify-center border-b border-border px-3"
    >
      {compact ? (
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
          C
        </span>
      ) : (
        <span className="text-xl font-bold tracking-tight">
          Career<span className="text-primary">Track</span>
        </span>
      )}
    </Link>
  );

  return (
    <>
      <aside
        aria-label="Application sidebar"
        className={[
          "hidden h-screen shrink-0 flex-col border-r border-border bg-card",
          "sticky top-0 lg:flex",
          "transition-[width] duration-200 motion-reduce:transition-none",
          collapsed ? "w-[72px]" : "w-64",
        ].join(" ")}
      >
        {brand(collapsed)}
        {navContent(collapsed, false)}

        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className={`h-5 w-5 transition-transform motion-reduce:transition-none ${
                collapsed ? "rotate-180" : ""
              }`}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={onCloseMobile}
            className="absolute inset-0 bg-black/60"
          />

          <aside
            id="mobile-navigation-panel"
            aria-label="Mobile sidebar"
            className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-2xl"
          >
            <div className="relative">
              {brand(false)}
              <button
                type="button"
                aria-label="Close navigation"
                onClick={onCloseMobile}
                className="absolute right-3 top-5 flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <span aria-hidden="true" className="text-xl">×</span>
              </button>
            </div>

            {navContent(false, true)}
          </aside>
        </div>
      )}
    </>
  );
}