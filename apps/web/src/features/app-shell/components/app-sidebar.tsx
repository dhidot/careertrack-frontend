"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    label: "Overview",
    href: "/dashboard",
    enabled: true,
  },
  {
    label: "Applications",
    href: "/applications",
    enabled: false,
  },
  {
    label: "Interviews",
    href: "/interviews",
    enabled: false,
  },
  {
    label: "Analytics",
    href: "/analytics",
    enabled: false,
  },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Application sidebar"
      className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex"
    >
      <div className="flex h-20 items-center border-b border-border px-6">
        <Link
          href="/dashboard"
          className="text-xl font-bold tracking-tight"
        >
          Career<span className="text-primary">Track</span>
        </Link>
      </div>

      <nav aria-label="Main navigation" className="flex-1 space-y-2 p-4">
        {navigation.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(`${item.href}/`));

          if (!item.enabled) {
            return (
              <span
                key={item.href}
                aria-disabled="true"
                className="flex cursor-not-allowed items-center justify-between rounded-xl px-4 py-3 text-sm text-muted-foreground/60"
              >
                {item.label}
                <span className="text-[10px]">Soon</span>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-5">
        <p className="text-xs text-muted-foreground">
          Your career workspace
        </p>
      </div>
    </aside>
  );
}