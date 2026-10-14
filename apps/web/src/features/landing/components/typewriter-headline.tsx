
"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

// ==========================================
// CONFIGURATION
// ==========================================

const PHRASES = [
  "organized.",
  "on track.",
  "in control.",
] as const;

const TYPING_SPEED = 95;
const DELETING_SPEED = 55;
const HOLD_DURATION = 1700;
const NEXT_PHRASE_DELAY = 300;

type TypingState = {
  phraseIndex: number;
  characterCount: number;
  deleting: boolean;
};

const INITIAL_STATE: TypingState = {
  phraseIndex: 0,
  characterCount: 0,
  deleting: false,
};

// ==========================================
// TYPEWRITER HEADLINE
// ==========================================

export function TypewriterHeadline() {
  const shouldReduceMotion = useReducedMotion();

  const [typing, setTyping] =
    useState<TypingState>(INITIAL_STATE);

  const activePhrase = PHRASES[typing.phraseIndex];

  // ========================================
  // TYPEWRITER LIFECYCLE
  // ========================================

  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }

    let delay: number;

    if (!typing.deleting) {
      delay =
        typing.characterCount < activePhrase.length
          ? TYPING_SPEED
          : HOLD_DURATION;
    } else {
      delay =
        typing.characterCount > 0
          ? DELETING_SPEED
          : NEXT_PHRASE_DELAY;
    }

    const timer = window.setTimeout(() => {
      setTyping((previous) => {
        const phrase = PHRASES[previous.phraseIndex];

        // Type characters.
        if (!previous.deleting) {
          if (
            previous.characterCount < phrase.length
          ) {
            return {
              ...previous,
              characterCount:
                previous.characterCount + 1,
            };
          }

          // Finished typing. Begin deleting.
          return {
            ...previous,
            deleting: true,
          };
        }

        // Delete characters.
        if (previous.characterCount > 0) {
          return {
            ...previous,
            characterCount:
              previous.characterCount - 1,
          };
        }

        // Switch to next phrase.
        return {
          phraseIndex:
            (previous.phraseIndex + 1) %
            PHRASES.length,
          characterCount: 0,
          deleting: false,
        };
      });
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [typing, activePhrase, shouldReduceMotion]);

  const displayedText = shouldReduceMotion
    ? PHRASES[0]
    : activePhrase.slice(0, typing.characterCount);

  // ========================================
  // RENDER
  // ========================================

  return (
    <h1
      aria-label={`Your job search, ${PHRASES[0]}`}
      className="text-[clamp(3rem,5.2vw,5.5rem)] font-semibold leading-[1.1] tracking-[-0.065em]"
    >
      <span
        aria-hidden="true"
        className="block"
      >
        Your job search,
      </span>

      <motion.span
        aria-hidden="true"
        initial={
          shouldReduceMotion
            ? false
            : { opacity: 0, y: 18 }
        }
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.65,
          delay: 0.2,
          ease: "easeOut",
        }}
        className="block min-h-[1.2em] text-primary"
      >
        <span data-testid="typed-phrase">
          {displayedText}
        </span>

        {!shouldReduceMotion && (
          <motion.span
            aria-hidden="true"
            className="ml-1 inline-block h-[0.85em] w-[3px] bg-primary align-[-0.08em]"
            animate={{
              opacity: [1, 0, 1],
            }}
            transition={{
              duration: 0.85,
              ease: "linear",
              repeat: Infinity,
            }}
          />
        )}
      </motion.span>
    </h1>
  );
}
