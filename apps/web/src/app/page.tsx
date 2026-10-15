
import type { Metadata } from "next";
import Link from "next/link";

import { ThemeToggle } from "@careertrack/ui/components/theme-toggle";

import { LandingPreview } from "@/features/landing/components/landing-preview";
import { TypewriterHeadline } from "@/features/landing/components/typewriter-headline";

import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: {
    absolute: "CareerTrack | Your job search, organized",
  },
  description:
    "Organize job applications, track progress, and stay focused on your next career move.",
};

const features = [
  {
    number: "01",
    symbol: "▦",
    title: "Everything in one place.",
    description:
      "Keep opportunities, companies, and application details organized in one workspace.",
  },
  {
    number: "02",
    symbol: "↗",
    title: "See where you stand.",
    description:
      "Follow each application through its stages and focus on opportunities that matter.",
  },
  {
    number: "03",
    symbol: "◎",
    title: "Make your next move.",
    description:
      "Stay prepared for interviews, reflect on your progress, and keep moving forward.",
  },
];

const workflow = [
  {
    number: "01",
    title: "Capture",
    description: "Add the opportunities you care about.",
  },
  {
    number: "02",
    title: "Organize",
    description: "Keep track of every application stage.",
  },
  {
    number: "03",
    title: "Move forward",
    description: "Know what deserves your attention next.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* ===================================
          NAVBAR
      =================================== */}

      <header
        className={`${styles.navEntrance} sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl`}
      >
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-5 sm:px-8 lg:px-12"
        >
          <Link
            href="/"
            aria-label="CareerTrack home"
            className="group flex items-center gap-3"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
              CT
            </span>

            <span className="text-lg font-semibold tracking-tight">
              careertrack
              <span className="text-primary">.</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Features
            </Link>

            <Link
              href="#how-it-works"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              How it works
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link
              href="/login"
              className="hidden text-sm font-medium transition-colors hover:text-primary sm:inline-flex"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className={`${styles.primaryButton} inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground sm:px-5 sm:text-sm`}
            >
              Get started ↗
            </Link>
          </div>
        </nav>
      </header>

      <main id="main-content">
        {/* ===================================
            HERO
        =================================== */}

        <section className="relative isolate overflow-hidden border-b border-border">
          <div
            aria-hidden="true"
            className={styles.heroGrid}
          />

          <div
            aria-hidden="true"
            className={`${styles.orb} ${styles.orbOne}`}
          />

          <div
            aria-hidden="true"
            className={`${styles.orb} ${styles.orbTwo}`}
          />

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-20 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:px-12 lg:pb-32 lg:pt-28">
            <div className="relative z-10 max-w-xl space-y-8">
              <div
                className={`${styles.heroEyebrow} inline-flex items-center gap-3 rounded-full border border-border bg-secondary/80 px-4 py-2`}
              >
                <span
                  aria-hidden="true"
                  className={`${styles.statusDot} size-2 rounded-full bg-primary`}
                />

                <span className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground">
                  YOUR NEXT CHAPTER STARTS HERE
                </span>
              </div>

              <div className="space-y-6">
                <TypewriterHeadline />

                <p
                  className={`${styles.heroDescription} max-w-lg text-base leading-8 text-muted-foreground sm:text-lg`}
                >
                  Less time juggling spreadsheets.
                  More time making moves that matter.
                  CareerTrack brings clarity to every
                  step of your job search.
                </p>
              </div>

              <div
                className={`${styles.heroActions} flex flex-wrap items-center gap-3`}
              >
                <Link
                  href="/register"
                  className={`${styles.primaryButton} inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-7 text-sm font-semibold text-primary-foreground`}
                >
                  Start tracking ↗
                </Link>

                <Link
                  href="#features"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border px-6 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-secondary"
                >
                  Explore features ↓
                </Link>

                <Link
                  href="/login"
                  className="inline-flex min-h-12 items-center text-sm font-medium text-muted-foreground hover:text-primary sm:hidden"
                >
                  Already have an account? Sign in
                </Link>
              </div>

              <div
                className={`${styles.heroFooter} border-t border-border pt-6`}
              >
                <p className="text-xs leading-5 text-muted-foreground">
                  Built for people taking the next
                  step in their careers.
                </p>
              </div>
            </div>

            {/* Animated dashboard preview */}
            <div className={styles.previewEntrance}>
              <div className={styles.previewFloat}>
                <LandingPreview />
              </div>
            </div>
          </div>

          <div
            aria-hidden="true"
            className={`${styles.bottomGlow} pointer-events-none absolute inset-x-0 bottom-0 h-px`}
          />
        </section>

        {/* ===================================
            FEATURES
        =================================== */}

        <section
          id="features"
          aria-labelledby="features-heading"
          className="scroll-mt-24 border-b border-border py-24 sm:py-28"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div
              className={`${styles.scrollReveal} mb-14 max-w-2xl space-y-5`}
            >
              <p className="text-xs font-semibold tracking-[0.16em] text-primary">
                WHY CAREERTRACK / 001
              </p>

              <h2
                id="features-heading"
                className="text-3xl font-semibold tracking-[-0.05em] sm:text-5xl"
              >
                Built for every step
                <span className="block text-muted-foreground">
                  of what comes next.
                </span>
              </h2>

              <p className="text-base leading-7 text-muted-foreground">
                A focused workspace designed around
                the challenges of navigating a job search.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.number}
                  className={`${styles.featureCard} ${styles.scrollReveal} flex min-h-72 flex-col rounded-2xl border border-border bg-card p-7`}
                >
                  <div className="flex items-start justify-between">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-2xl text-primary">
                      {feature.symbol}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      / {feature.number}
                    </span>
                  </div>

                  <div className="mt-auto space-y-3 pt-12">
                    <h3 className="text-xl font-semibold tracking-tight">
                      {feature.title}
                    </h3>

                    <p className="text-sm leading-7 text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================
            HOW IT WORKS
        =================================== */}

        <section
          id="how-it-works"
          aria-labelledby="workflow-heading"
          className="scroll-mt-24 bg-secondary py-24 sm:py-28"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div
              className={`${styles.scrollReveal} mb-14 space-y-5`}
            >
              <p className="text-xs font-semibold tracking-[0.16em] text-primary">
                THE PROCESS / 002
              </p>

              <h2
                id="workflow-heading"
                className="text-3xl font-semibold tracking-[-0.05em] sm:text-5xl"
              >
                Simple by design.
              </h2>

              <p className="max-w-xl text-base leading-7 text-muted-foreground">
                A clearer way to approach the opportunities
                ahead, without the clutter.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {workflow.map((step) => (
                <div
                  key={step.number}
                  className={`${styles.workflowItem} ${styles.scrollReveal} border-t border-border pt-6`}
                >
                  <p className="mb-12 text-sm font-medium text-primary">
                    {step.number} /
                  </p>

                  <h3 className="mb-3 text-2xl font-semibold tracking-tight">
                    {step.title}
                  </h3>

                  <p className="text-sm leading-7 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================
            FINAL CTA
        =================================== */}

        <section className="relative isolate overflow-hidden border-t border-border py-28 sm:py-36">
          <div
            aria-hidden="true"
            className={`${styles.ctaGlow} pointer-events-none absolute inset-0`}
          />

          <div
            className={`${styles.scrollReveal} relative mx-auto flex max-w-4xl flex-col items-center gap-8 px-5 text-center sm:px-8`}
          >
            <p className="text-xs font-semibold tracking-[0.16em] text-primary">
              YOUR NEXT MOVE / 003
            </p>

            <h2 className="text-4xl font-semibold leading-[1.1] tracking-[-0.06em] sm:text-6xl">
              A better way to keep
              <span className="block text-primary">
                moving forward.
              </span>
            </h2>

            <p className="max-w-xl text-base leading-8 text-muted-foreground">
              Your career journey is bigger than a list
              of applications. Give it a space of its own.
            </p>

            <Link
              href="/register"
              className={`${styles.primaryButton} inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground`}
            >
              Create your account ↗
            </Link>
          </div>
        </section>
      </main>

      {/* ===================================
          FOOTER
      =================================== */}

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <div className="space-y-1">
            <p className="font-semibold tracking-tight">
              careertrack
              <span className="text-primary">.</span>
            </p>

            <p className="text-xs text-muted-foreground">
              Built for what&apos;s next.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <p className="text-xs text-muted-foreground">
              © 2026 CareerTrack
            </p>

            <a
              href="#main-content"
              className="text-xs font-medium hover:text-primary"
            >
              Back to top ↑
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
