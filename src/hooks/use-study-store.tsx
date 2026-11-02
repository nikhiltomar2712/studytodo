"use client"

/**
 * StudyFlow — central data store.
 *
 * A single React context holds the entire StudyData object, persisted to
 * localStorage on every change. Components read via `useStudyStore()` and
 * mutate through the action callbacks below — no backend required.
 */

import * as React from "react"
import {
  createEmptyData,
  DEFAULT_POMODORO,
  type Deck,
  type DeckColor,
  type Flashcard,
  type Note,
  type PomodoroSettings,
  type Rating,
  type ReviewLogEntry,
  type StudyData,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type TimerMode,
} from "@/lib/types"
import { schedule } from "@/lib/srs"
import { dayKey } from "@/lib/date-utils"

const STORAGE_KEY = "studyflow:data:v1"
const MAX_REVIEW_LOG = 2000
const MAX_FOCUS_SESSIONS = 500

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function loadData(): StudyData {
  if (typeof window === "undefined") return createEmptyData()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyData()
    const parsed = JSON.parse(raw) as Partial<StudyData>
    const base = createEmptyData()
    return {
      version: base.version,
      decks: Array.isArray(parsed.decks) ? parsed.decks : [],
      cards: Array.isArray(parsed.cards) ? parsed.cards : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      focusSessions: Array.isArray(parsed.focusSessions)
        ? parsed.focusSessions
        : [],
      activity:
        parsed.activity && typeof parsed.activity === "object"
          ? parsed.activity
          : {},
      settings: {
        pomodoro: {
          ...DEFAULT_POMODORO,
          ...(parsed.settings?.pomodoro ?? {}),
        },
      },
    }
  } catch {
    return createEmptyData()
  }
}

/* ------------------------------------------------------------------ */
/* Selectors (pure functions over StudyData)                           */
/* ------------------------------------------------------------------ */

export function cardsOfDeck(data: StudyData, deckId: string): Flashcard[] {
  return data.cards.filter((c) => c.deckId === deckId)
}

export function dueCards(data: StudyData, deckId?: string): Flashcard[] {
  const now = Date.now()
  return data.cards.filter(
    (c) => (!deckId || c.deckId === deckId) && c.dueAt <= now
  )
}

export function deckStats(data: StudyData, deckId: string) {
  const cards = cardsOfDeck(data, deckId)
  const now = Date.now()
  const due = cards.filter((c) => c.dueAt <= now).length
  const matured = cards.filter((c) => c.intervalDays >= 21).length
  return {
    total: cards.length,
    due,
    matured,
    masteryPct: cards.length ? Math.round((matured / cards.length) * 100) : 0,
  }
}

/** Consecutive-day streak based on any study activity (reviews or focus minutes). */
export function computeStreak(activity: StudyData["activity"]): number {
  const isActive = (key: string) => {
    const day = activity[key]
    return !!day && (day.reviews > 0 || day.focusMinutes > 0)
  }
  const today = new Date()
  let streak = 0
  // If today is inactive, the streak may still be alive from yesterday.
  if (!isActive(dayKey(today))) {
    const yesterday = new Date(today.getTime() - 86_400_000)
    if (!isActive(dayKey(yesterday))) return 0
  }
  const cursor = new Date()
  for (let i = 0; i < 3660; i++) {
    if (isActive(dayKey(cursor))) {
      streak += 1
      cursor.setTime(cursor.getTime() - 86_400_000)
    } else {
      break
    }
  }
  return streak
}

export function masteryPercent(data: StudyData): number {
  if (!data.cards.length) return 0
  const matured = data.cards.filter((c) => c.intervalDays >= 21).length
  return Math.round((matured / data.cards.length) * 100)
}

export function totalReviews(data: StudyData): number {
  return data.cards.reduce((sum, c) => sum + c.totalReviews, 0)
}

export function todayActivity(data: StudyData) {
  const key = dayKey()
  const day = data.activity[key] ?? { reviews: 0, focusMinutes: 0 }
  return day
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export interface StudyStore {
  data: StudyData
  hydrated: boolean
  /* decks */
  addDeck: (name: string, description: string, color: DeckColor) => string
  updateDeck: (id: string, patch: Partial<Pick<Deck, "name" | "description" | "color">>) => void
  deleteDeck: (id: string) => void
  /* cards */
  addCard: (deckId: string, front: string, back: string, tags: string[]) => string
  updateCard: (id: string, patch: Partial<Pick<Flashcard, "front" | "back" | "tags" | "deckId">>) => void
  deleteCard: (id: string) => void
  resetCardProgress: (id: string) => void
  reviewCard: (cardId: string, rating: Rating) => void
  /* tasks */
  addTask: (title: string, status: TaskStatus, priority: TaskPriority, notes?: string, starred?: boolean) => string
  updateTask: (id: string, patch: Partial<Pick<Task, "title" | "notes" | "status" | "priority" | "starred">>) => void
  moveTask: (id: string, status: TaskStatus) => void
  deleteTask: (id: string) => void
  clearCompletedTasks: () => void
  /* notes */
  addNote: (title: string, content: string) => string
  updateNote: (id: string, patch: Partial<Pick<Note, "title" | "content">>) => void
  deleteNote: (id: string) => void
  /* focus sessions */
  logFocusSession: (durationMs: number, startedAt: number, mode: TimerMode) => void
  /* settings */
  updatePomodoroSettings: (patch: Partial<PomodoroSettings>) => void
  /* danger zone */
  resetAllData: () => void
}

const StudyStoreContext = React.createContext<StudyStore | null>(null)

export function StudyStoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<StudyData>(() => createEmptyData())
  const [hydrated, setHydrated] = React.useState(false)

  // Load once on mount (client only) to avoid SSR/localStorage mismatches.
  React.useEffect(() => {
    setData(loadData())
    setHydrated(true)
  }, [])

  // Persist on every change after hydration.
  React.useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Storage full / unavailable — the app still works in-memory.
    }
  }, [data, hydrated])

  const bumpActivity = React.useCallback(
    (prev: StudyData, kind: "reviews" | "focusMinutes", amount: number) => {
      const key = dayKey()
      const day = prev.activity[key] ?? { reviews: 0, focusMinutes: 0 }
      return {
        ...prev.activity,
        [key]:
          kind === "reviews"
            ? { ...day, reviews: day.reviews + amount }
            : { ...day, focusMinutes: day.focusMinutes + amount },
      }
    },
    []
  )

  const store = React.useMemo<StudyStore>(() => {
    return {
      data,
      hydrated,

      addDeck: (name, description, color) => {
        const id = uid()
        setData((prev) => ({
          ...prev,
          decks: [
            { id, name, description, color, createdAt: Date.now() },
            ...prev.decks,
          ],
        }))
        return id
      },

      updateDeck: (id, patch) =>
        setData((prev) => ({
          ...prev,
          decks: prev.decks.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),

      deleteDeck: (id) =>
        setData((prev) => ({
          ...prev,
          decks: prev.decks.filter((d) => d.id !== id),
          cards: prev.cards.filter((c) => c.deckId !== id),
        })),

      addCard: (deckId, front, back, tags) => {
        const id = uid()
        const now = Date.now()
        setData((prev) => ({
          ...prev,
          cards: [
            ...prev.cards,
            {
              id,
              deckId,
              front,
              back,
              tags,
              createdAt: now,
              updatedAt: now,
              reps: 0,
              lapses: 0,
              ease: 2.5,
              intervalDays: 0,
              dueAt: 0, // new cards are immediately due
              lastReviewedAt: null,
              totalReviews: 0,
            },
          ],
        }))
        return id
      },

      updateCard: (id, patch) =>
        setData((prev) => ({
          ...prev,
          cards: prev.cards.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c
          ),
        })),

      deleteCard: (id) =>
        setData((prev) => ({
          ...prev,
          cards: prev.cards.filter((c) => c.id !== id),
        })),

      resetCardProgress: (id) =>
        setData((prev) => ({
          ...prev,
          cards: prev.cards.map((c) =>
            c.id === id
              ? {
                  ...c,
                  reps: 0,
                  lapses: 0,
                  ease: 2.5,
                  intervalDays: 0,
                  dueAt: 0,
                  lastReviewedAt: null,
                }
              : c
          ),
        })),

      reviewCard: (cardId, rating) => {
        const now = Date.now()
        setData((prev) => {
          const card = prev.cards.find((c) => c.id === cardId)
          if (!card) return prev
          const next = schedule(card, rating, now)
          const updatedCard: Flashcard = {
            ...card,
            reps: next.reps,
            lapses: next.lapses,
            ease: next.ease,
            intervalDays: next.intervalDays,
            dueAt: next.dueAt,
            lastReviewedAt: now,
            totalReviews: card.totalReviews + 1,
          }
          const entry: ReviewLogEntry = {
            id: uid(),
            cardId,
            deckId: card.deckId,
            rating,
            reviewedAt: now,
          }
          return {
            ...prev,
            cards: prev.cards.map((c) => (c.id === cardId ? updatedCard : c)),
            reviews: [...prev.reviews, entry].slice(-MAX_REVIEW_LOG),
            activity: bumpActivity(prev, "reviews", 1),
          }
        })
      },

      addTask: (title, status, priority, notes = "", starred = false) => {
        const id = uid()
        setData((prev) => ({
          ...prev,
          tasks: [
            {
              id,
              title,
              notes,
              status,
              priority,
              starred,
              createdAt: Date.now(),
              completedAt: status === "done" ? Date.now() : null,
            },
            ...prev.tasks,
          ],
        }))
        return id
      },

      updateTask: (id, patch) =>
        setData((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...patch,
                  completedAt:
                    patch.status === "done"
                      ? (t.completedAt ?? Date.now())
                      : patch.status
                        ? null
                        : t.completedAt,
                }
              : t
          ),
        })),

      moveTask: (id, status) =>
        setData((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  completedAt:
                    status === "done" ? (t.completedAt ?? Date.now()) : null,
                }
              : t
          ),
        })),

      deleteTask: (id) =>
        setData((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== id),
        })),

      clearCompletedTasks: () =>
        setData((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((t) => t.status !== "done"),
        })),

      addNote: (title, content) => {
        const id = uid()
        const now = Date.now()
        setData((prev) => ({
          ...prev,
          notes: [{ id, title, content, createdAt: now, updatedAt: now }, ...prev.notes],
        }))
        return id
      },

      updateNote: (id, patch) =>
        setData((prev) => ({
          ...prev,
          notes: prev.notes.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n
          ),
        })),

      deleteNote: (id) =>
        setData((prev) => ({
          ...prev,
          notes: prev.notes.filter((n) => n.id !== id),
        })),

      logFocusSession: (durationMs, startedAt, mode) => {
        setData((prev) => {
          const minutes = Math.max(1, Math.round(durationMs / 60_000))
          return {
            ...prev,
            focusSessions: [
              ...prev.focusSessions,
              {
                id: uid(),
                startedAt,
                endedAt: Date.now(),
                durationMs,
                mode,
              },
            ].slice(-MAX_FOCUS_SESSIONS),
            activity: bumpActivity(prev, "focusMinutes", minutes),
          }
        })
      },

      updatePomodoroSettings: (patch) =>
        setData((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            pomodoro: { ...prev.settings.pomodoro, ...patch },
          },
        })),

      resetAllData: () => {
        setData(createEmptyData())
      },
    }
  }, [data, hydrated, bumpActivity])

  return (
    <StudyStoreContext.Provider value={store}>
      {children}
    </StudyStoreContext.Provider>
  )
}

export function useStudyStore(): StudyStore {
  const ctx = React.useContext(StudyStoreContext)
  if (!ctx) {
    throw new Error("useStudyStore must be used within a StudyStoreProvider")
  }
  return ctx
}

export { uid }
