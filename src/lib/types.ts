/**
 * StudyFlow — shared domain types.
 * All data lives in localStorage; nothing here is sent to a server.
 */

export type View =
  | "dashboard"
  | "flashcards"
  | "timer"
  | "tasks"
  | "notes";

/** Intent used when another view (e.g. Dashboard) wants Flashcards to do something. */
export type FlashcardsIntent =
  | { type: "decks" }
  | { type: "review-due"; deckId?: string }
  | { type: "create-deck" };

export const DECK_COLORS = [
  "emerald",
  "teal",
  "amber",
  "orange",
  "rose",
  "violet",
  "cyan",
  "lime",
  "fuchsia",
  "slate",
] as const;

export type DeckColor = (typeof DECK_COLORS)[number];

export interface Deck {
  id: string;
  name: string;
  description: string;
  color: DeckColor;
  createdAt: number;
}

export type Rating = "again" | "hard" | "good" | "easy";

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  /* SRS state */
  reps: number; // successful consecutive reviews
  lapses: number; // times rated "Again"
  ease: number; // SM-2 ease factor (1.3 – 3.0)
  intervalDays: number; // current scheduled interval in days (0 => learning)
  dueAt: number; // epoch ms when the card is next due
  lastReviewedAt: number | null;
  totalReviews: number;
}

export interface ReviewLogEntry {
  id: string;
  cardId: string;
  deckId: string;
  rating: Rating;
  reviewedAt: number;
}

export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  priority: TaskPriority;
  starred: boolean; // "today's goal"
  createdAt: number;
  completedAt: number | null;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export type TimerMode = "focus" | "short" | "long";

export interface FocusSession {
  id: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  mode: TimerMode;
}

export interface ActivityDay {
  reviews: number;
  focusMinutes: number;
}

export interface PomodoroSettings {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  sessionsBeforeLongBreak: number;
  autoStartNext: boolean;
  soundEnabled: boolean;
}

export interface StudyData {
  version: number;
  decks: Deck[];
  cards: Flashcard[];
  reviews: ReviewLogEntry[];
  tasks: Task[];
  notes: Note[];
  focusSessions: FocusSession[];
  /** keyed by local YYYY-MM-DD */
  activity: Record<string, ActivityDay>;
  settings: {
    pomodoro: PomodoroSettings;
  };
}

export const DEFAULT_POMODORO: PomodoroSettings = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  sessionsBeforeLongBreak: 4,
  autoStartNext: true,
  soundEnabled: true,
};

export function createEmptyData(): StudyData {
  return {
    version: 1,
    decks: [],
    cards: [],
    reviews: [],
    tasks: [],
    notes: [],
    focusSessions: [],
    activity: {},
    settings: { pomodoro: { ...DEFAULT_POMODORO } },
  };
}
