
import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@careertrack/ui/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh w-full bg-background text-foreground lg:grid-cols-[46%_54%]">
      {/* Brand / Editorial Panel */}
      <aside className="hidden min-h-dvh flex-col justify-between border-r border-border/60 bg-secondary px-10 py-10 lg:flex xl:px-16 xl:py-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            CT
          </div>
          <span className="text-lg font-semibold tracking-tight">
            careertrack.
          </span>
        </Link>

        <div className="max-w-xl space-y-10">
          <div className="space-y-6">
            <p className="text-xs font-semibold tracking-[0.18em] text-primary">
              YOUR NEXT CHAPTER / 001
            </p>

            <h1 className="text-[clamp(3rem,4.3vw,5rem)] font-semibold leading-[1.05] tracking-[-0.055em]">
              Less tracking.
              <br />
              <span className="text-primary">
                More moving.
              </span>
            </h1>

            <p className="max-w-md text-base leading-7 text-muted-foreground">
              A thoughtful space to organize opportunities,
              prepare for interviews, and move forward.
            </p>
          </div>

          {/* Illustrative application activity */}
          <div className="max-w-md border-t border-border/70">
            <div className="flex items-center justify-between border-b border-border/70 py-5">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Product Engineer
                </p>
                <p className="text-xs text-muted-foreground">
                  Next up: Technical interview
                </p>
              </div>
              <span className="text-lg text-primary" aria-hidden="true">
                ↗
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border/70 py-5">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Backend Developer
                </p>
                <p className="text-xs text-muted-foreground">
                  Application submitted
                </p>
              </div>
              <span className="text-sm text-muted-foreground" aria-hidden="true">
                ✓
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs tracking-[0.12em] text-muted-foreground">
          BUILT FOR WHAT&apos;S NEXT. ↗
        </p>
      </aside>

      {/* Authentication Panel */}
      <section className="flex min-h-dvh min-w-0 flex-col bg-background">
        <header className="flex items-center justify-between px-6 py-6 sm:px-12">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight lg:hidden"
          >
            careertrack.
          </Link>

          <span className="hidden text-xs tracking-[0.15em] text-muted-foreground lg:block">
            YOUR CAREER, ORGANIZED.
          </span>

          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-12">
          <div className="w-full max-w-[430px]">
            {children}
          </div>
        </main>

        <footer className="px-6 py-6 text-center text-xs text-muted-foreground/70">
          CAREERTRACK © 2026
        </footer>
      </section>
    </div>
  );
}
