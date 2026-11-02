/**
 * StudyFlow — Spaced Repetition scheduler.
 *
 * A pragmatic, SM-2 inspired algorithm tuned for a local-first study app:
 *  - "Again"   → card lapses, returns to learning, shown again in minutes.
 *  - "Hard"    → small interval bump, ease drops.
 *  - "Good"    → standard interval growth by ease factor.
 *  - "Easy"    → fast growth, ease rises.
 */

import type { Flashcard, Rating } from "./types";

export const MASTERY_THRESHOLD_DAYS = 21;
export const MIN_EASE = 1.3;
export const MAX_EASE = 3.0;
export const MAX_INTERVAL_DAYS = 365;

const MINUTE = 60_000;
const DAY_MS = 24 * 60 * 60_000;

export interface SchedulingResult {
  reps: number;
  lapses: number;
  ease: number;
  intervalDays: number;
  dueAt: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Core scheduling math for a single review. `intervalDays` of the card before review is used. */
export function schedule(
  card: Pick<Flashcard, "reps" | "lapses" | "ease" | "intervalDays">,
  rating: Rating,
  now: number = Date.now()
): SchedulingResult {
  let { reps, lapses, ease, intervalDays } = card;

  if (rating === "again") {
    // Lapse: relearn in 10 minutes.
    lapses += 1;
    reps = 0;
    ease = clamp(ease - 0.2, MIN_EASE, MAX_EASE);
    intervalDays = 10 * MINUTE / DAY_MS;
  } else {
    reps += 1;
    if (rating === "hard") {
      ease = clamp(ease - 0.15, MIN_EASE, MAX_EASE);
      if (reps === 1) {
        intervalDays = 0.5; // 12 hours
      } else {
        intervalDays = Math.max(intervalDays * 1.2, intervalDays + 0.5);
      }
    } else if (rating === "good") {
      if (reps === 1) intervalDays = 1;
      else if (reps === 2) intervalDays = 3;
      else intervalDays = intervalDays * ease;
    } else {
      // easy
      ease = clamp(ease + 0.15, MIN_EASE, MAX_EASE);
      if (reps === 1) intervalDays = 4;
      else if (reps === 2) intervalDays = 6;
      else intervalDays = intervalDays * ease * 1.3;
    }
    intervalDays = clamp(intervalDays, 0, MAX_INTERVAL_DAYS);
  }

  const dueAt = now + intervalDays * DAY_MS;
  return { reps, lapses, ease, intervalDays, dueAt };
}

/** Human readable preview of the next interval for a given rating (used on rating buttons). */
export function previewInterval(
  card: Pick<Flashcard, "reps" | "lapses" | "ease" | "intervalDays">,
  rating: Rating,
  now: number = Date.now()
): string {
  const { intervalDays } = schedule(card, rating, now);
  return formatIntervalDays(intervalDays);
}

/** Formats an interval expressed in days (can be fractional for minutes/hours). */
export function formatIntervalDays(days: number): string {
  if (days <= 0) return "now";
  const minutes = days * 24 * 60;
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)}h`;
  if (days < 31) {
    const d = Math.round(days);
    return d === 1 ? "1d" : `${d}d`;
  }
  if (days < 365) {
    const m = Math.round(days / 30.44);
    return m === 1 ? "1mo" : `${m}mo`;
  }
  const y = (days / 365).toFixed(1).replace(/\.0$/, "");
  return `${y}y`;
}

/** Relative description of when a card is due, e.g. "now", "in 3d", "tomorrow". */
export function describeDue(dueAt: number, now: number = Date.now()): string {
  const diff = dueAt - now;
  if (diff <= 0) return "due now";
  return `in ${formatIntervalDays(diff / DAY_MS)}`;
}

export function isDue(card: Flashcard, now: number = Date.now()): boolean {
  return card.dueAt <= now;
}

export function isMature(card: Flashcard): boolean {
  return card.intervalDays >= MASTERY_THRESHOLD_DAYS;
}

export function isNew(card: Flashcard): boolean {
  return card.totalReviews === 0;
}

/** Shuffle helper (Fisher–Yates) — returns a new array. */
export function shuffled<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
