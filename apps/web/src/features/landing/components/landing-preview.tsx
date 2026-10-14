
"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";

// ==========================================
// DEMO CONFIGURATION
// ==========================================

const DEMO_INTERVAL_MS = 3200;

const STAGES = [
  {
    label: "Applied",
    description: "Application submitted",
    detail: "Your application is on its way.",
    progress: 30,
  },
  {
    label: "Interview",
    description: "Interview scheduled",
    detail: "One step closer to your next move.",
    progress: 72,
  },
  {
    label: "Offer",
    description: "Offer received",
    detail: "A new opportunity is within reach.",
    progress: 100,
  },
] as const;

const OTHER_APPLICATIONS = [
  {
    company: "Orbit Systems",
    position: "Software Developer",
    stage: "In review",
    initials: "OS",
  },
  {
    company: "Studio Atlas",
    position: "Fullstack Engineer",
    stage: "Applied",
    initials: "SA",
  },
] as const;

// ==========================================
// LANDING PREVIEW
// ==========================================

export function LandingPreview() {
  const [stageIndex, setStageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const shouldReduceMotion = useReducedMotion();

  const currentStage = STAGES[stageIndex];

  // ========================================
  // AUTOMATIC STAGE TRANSITION
  // ========================================

  useEffect(() => {
    if (shouldReduceMotion || !isPlaying) {
      return;
    }

    const interval = window.setInterval(() => {
      setStageIndex(
        (previous) => (previous + 1) % STAGES.length
      );
    }, DEMO_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [shouldReduceMotion, isPlaying]);

  // ========================================
  // MANUAL STAGE SELECTION
  // ========================================

  function selectStage(index: number) {
    setStageIndex(index);

    // Manual interaction pauses autoplay.
    setIsPlaying(false);
  }

  // ========================================
  // ILLUSTRATIVE METRICS
  // ========================================

  const metrics = [
    {
      label: "Applied",
      count: "24",
    },
    {
      label: "Interviews",
      count: stageIndex >= 1 ? "07" : "06",
    },
    {
      label: "Offers",
      count: stageIndex === 2 ? "03" : "02",
    },
  ];

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.35,
    ease: "easeOut" as const,
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="relative mx-auto w-full max-w-[550px]">
      {/* =====================================
          AMBIENT GLOW
      ===================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 rounded-3xl bg-primary/5 blur-3xl"
      />

      <section
        aria-label="Illustrative application dashboard"
        className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/10"
      >
        {/* ===================================
            DASHBOARD HEADER
        =================================== */}

        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              CT
            </div>

            <div>
              <p className="text-xs font-semibold">
                My workspace
              </p>

              <p className="text-[10px] text-muted-foreground">
                CareerTrack / Overview
              </p>
            </div>
          </div>

          {/* =================================
              PLAY / PAUSE
          ================================= */}

          {!shouldReduceMotion ? (
            <button
              type="button"
              onClick={() => {
                setIsPlaying((previous) => !previous);
              }}
              aria-label={
                isPlaying ? "Pause demo" : "Play demo"
              }
              className="rounded-full border border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {isPlaying ? "Ⅱ Pause" : "▶ Play"}
            </button>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              Manual preview
            </span>
          )}
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          {/* =================================
              DASHBOARD HEADING
          ================================= */}

          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary">
              Your momentum
            </p>

            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Applications at a glance
            </h2>

            <p className="text-xs text-muted-foreground">
              See how each opportunity moves forward.
            </p>
          </div>

          {/* =================================
              METRICS
          ================================= */}

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-border bg-secondary p-3 sm:p-4"
              >
                <p className="text-[10px] text-muted-foreground">
                  {metric.label}
                </p>

                <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
                  {metric.count}
                </p>
              </div>
            ))}
          </div>

          {/* =================================
              ANIMATED APPLICATION PIPELINE
          ================================= */}

          <div className="space-y-4 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold">
                  Application journey
                </h3>

                <p className="text-[10px] text-muted-foreground">
                  Northstar Labs · Backend Engineer
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">
                Live demo
              </span>
            </div>

            {/* Progress indicator */}

            <div
              role="progressbar"
              aria-label="Example application progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={currentStage.progress}
              className="h-2.5 overflow-hidden rounded-full bg-secondary"
            >
              <motion.div
                initial={false}
                animate={{
                  width: `${currentStage.progress}%`,
                }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.7,
                  ease: "easeInOut",
                }}
                className="h-full rounded-full bg-primary"
              />
            </div>

            {/* Animated stage description */}

            <div className="min-h-12 overflow-hidden">
              <AnimatePresence
                mode="wait"
                initial={false}
              >
                <motion.div
                  key={currentStage.label}
                  initial={
                    shouldReduceMotion
                      ? false
                      : { opacity: 0, y: 8 }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: -8 }
                  }
                  transition={transition}
                  className="space-y-1"
                >
                  <p className="text-xs font-semibold text-foreground">
                    {currentStage.description}
                  </p>

                  <p className="text-[11px] text-muted-foreground">
                    {currentStage.detail}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Manual stage controls */}

            <div
              role="group"
              aria-label="Select demo stage"
              className="grid grid-cols-3 gap-2"
            >
              {STAGES.map((stage, index) => {
                const isActive = stageIndex === index;

                return (
                  <button
                    key={stage.label}
                    type="button"
                    onClick={() => selectStage(index)}
                    aria-label={`Show ${stage.label} stage`}
                    aria-pressed={isActive}
                    className={[
                      "rounded-lg px-2 py-2 text-[10px] font-semibold",
                      "transition-colors duration-200",
                      "focus-visible:outline-2",
                      "focus-visible:outline-offset-2",
                      "focus-visible:outline-primary",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    {stage.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* =================================
              RECENT APPLICATIONS
          ================================= */}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold">
                Recent applications
              </h3>

              <span className="text-[10px] text-muted-foreground">
                Example data
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              {/* Main animated application */}

              <div className="flex items-center justify-between gap-3 border-b border-border p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-[10px] font-semibold">
                    NL
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">
                      Backend Engineer
                    </p>

                    <p className="truncate text-[10px] text-muted-foreground">
                      Northstar Labs
                    </p>
                  </div>
                </div>

                <AnimatePresence
                  mode="wait"
                  initial={false}
                >
                  <motion.span
                    key={currentStage.label}
                    data-testid="demo-current-status"
                    initial={
                      shouldReduceMotion
                        ? false
                        : {
                            opacity: 0,
                            scale: 0.85,
                            y: 6,
                          }
                    }
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                    }}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 1 }
                        : {
                            opacity: 0,
                            scale: 0.85,
                            y: -6,
                          }
                    }
                    transition={transition}
                    className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary"
                  >
                    {currentStage.label}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Other illustrative applications */}

              {OTHER_APPLICATIONS.map(
                (application, index) => (
                  <div
                    key={application.company}
                    className={`flex items-center justify-between gap-3 p-3 ${
                      index < OTHER_APPLICATIONS.length - 1
                        ? "border-b border-border"
                        : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-[10px] font-semibold">
                        {application.initials}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">
                          {application.position}
                        </p>

                        <p className="truncate text-[10px] text-muted-foreground">
                          {application.company}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                      {application.stage}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          DEMO DISCLAIMER
      ===================================== */}

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Illustrative product preview with example data.
      </p>
    </div>
  );
}
