"use client"

/**
 * StudyFlow — Pomodoro timer engine.
 *
 * Lives at the app-root level so the countdown keeps ticking while the user
 * navigates between views. Uses wall-clock targets (`endAt`) rather than
 * naive tick counting, so it stays accurate even if the tab throttles.
 */

import * as React from "react"
import { toast } from "sonner"
import { useStudyStore } from "@/hooks/use-study-store"
import type { TimerMode } from "@/lib/types"
import { playBreakCompleteChime, playFocusCompleteChime } from "@/lib/chime"
import { formatDuration } from "@/lib/date-utils"

export const TIMER_LABELS: Record<TimerMode, string> = {
  focus: "Focus",
  short: "Short Break",
  long: "Long Break",
}

interface PomodoroContextValue {
  mode: TimerMode
  running: boolean
  remainingMs: number
  durationMs: number
  completedFocusCount: number
  progress: number // 0..1 elapsed fraction
  justFinished: TimerMode | null
  start: () => void
  pause: () => void
  toggle: () => void
  reset: () => void
  skip: () => void
  setMode: (mode: TimerMode) => void
}

const PomodoroContext = React.createContext<PomodoroContextValue | null>(null)

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const { data, logFocusSession } = useStudyStore()
  const settings = data.settings.pomodoro

  const durationFor = React.useCallback(
    (mode: TimerMode) => {
      const min =
        mode === "focus"
          ? settings.focusMin
          : mode === "short"
            ? settings.shortBreakMin
            : settings.longBreakMin
      return Math.max(1, min) * 60_000
    },
    [settings.focusMin, settings.shortBreakMin, settings.longBreakMin]
  )

  const [mode, setModeState] = React.useState<TimerMode>("focus")
  const [running, setRunning] = React.useState(false)
  const [remainingMs, setRemainingMs] = React.useState(() => 25 * 60_000)
  const [endAt, setEndAt] = React.useState<number | null>(null)
  const [startedAt, setStartedAt] = React.useState<number | null>(null)
  const [completedFocusCount, setCompletedFocusCount] = React.useState(0)
  const [justFinished, setJustFinished] = React.useState<TimerMode | null>(null)

  const durationMs = durationFor(mode)

  // Keep an idle timer in sync with settings changes.
  React.useEffect(() => {
    if (!running) {
      setRemainingMs(durationFor(mode))
    }
  }, [durationFor, mode, running])

  const finish = React.useCallback(
    (opts: { logSession: boolean; notify: boolean }) => {
      const now = Date.now()
      if (mode === "focus") {
        if (opts.logSession && startedAt) {
          const elapsed = Math.min(durationMs, now - startedAt)
          logFocusSession(elapsed, startedAt, "focus")
          if (opts.notify) {
            if (settings.soundEnabled) playFocusCompleteChime()
            toast.success("Focus session complete", {
              description: `${formatDuration(elapsed)} logged — ${
                (completedFocusCount + 1) % settings.sessionsBeforeLongBreak === 0
                  ? "time for a long break."
                  : "time for a short break."
              }`,
            })
          }
        }
        setCompletedFocusCount((n) => n + 1)
        const next: TimerMode =
          (completedFocusCount + 1) % settings.sessionsBeforeLongBreak === 0
            ? "long"
            : "short"
        setJustFinished("focus")
        setModeState(next)
        setRemainingMs(durationFor(next))
        if (settings.autoStartNext) {
          setEndAt(now + durationFor(next))
          setStartedAt(now)
          setRunning(true)
        } else {
          setEndAt(null)
          setStartedAt(null)
          setRunning(false)
        }
      } else {
        if (opts.notify) {
          if (settings.soundEnabled) playBreakCompleteChime()
          toast.success("Break over", {
            description: "Ready for another focus session?",
          })
        }
        setJustFinished(mode)
        setModeState("focus")
        setRemainingMs(durationFor("focus"))
        if (settings.autoStartNext) {
          setEndAt(now + durationFor("focus"))
          setStartedAt(now)
          setRunning(true)
        } else {
          setEndAt(null)
          setStartedAt(null)
          setRunning(false)
        }
      }
    },
    [
      mode,
      startedAt,
      durationMs,
      durationFor,
      logFocusSession,
      completedFocusCount,
      settings.sessionsBeforeLongBreak,
      settings.autoStartNext,
      settings.soundEnabled,
    ]
  )

  // Tick loop.
  React.useEffect(() => {
    if (!running || endAt === null) return
    const interval = window.setInterval(() => {
      const rem = (endAt as number) - Date.now()
      if (rem <= 0) {
        setRemainingMs(0)
        finish({ logSession: true, notify: true })
      } else {
        setRemainingMs(rem)
      }
    }, 250)
    return () => window.clearInterval(interval)
  }, [running, endAt, finish])

  // Reflect the countdown in the browser tab title while running.
  React.useEffect(() => {
    if (!running) {
      document.title = "StudyFlow — Focus. Learn. Retain."
      return
    }
    const mm = Math.floor(remainingMs / 60_000)
    const ss = Math.floor((remainingMs % 60_000) / 1000)
    document.title = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")} ${mode === "focus" ? "Focus" : "Break"} — StudyFlow`
  }, [running, remainingMs, mode])

  const start = React.useCallback(() => {
    const now = Date.now()
    setEndAt(now + remainingMs)
    setStartedAt((s) => s ?? now)
    setRunning(true)
  }, [remainingMs])

  const pause = React.useCallback(() => {
    if (endAt !== null) {
      setRemainingMs(Math.max(0, endAt - Date.now()))
    }
    setEndAt(null)
    setRunning(false)
  }, [endAt])

  const toggle = React.useCallback(() => {
    if (running) pause()
    else start()
  }, [running, pause, start])

  const reset = React.useCallback(() => {
    setEndAt(null)
    setStartedAt(null)
    setRunning(false)
    setRemainingMs(durationFor(mode))
    setJustFinished(null)
  }, [durationFor, mode])

  const skip = React.useCallback(() => {
    finish({ logSession: false, notify: false })
  }, [finish])

  const setMode = React.useCallback(
    (next: TimerMode) => {
      setModeState(next)
      setRunning(false)
      setEndAt(null)
      setStartedAt(null)
      setRemainingMs(durationFor(next))
      setJustFinished(null)
    },
    [durationFor]
  )

  const value = React.useMemo<PomodoroContextValue>(() => {
    const elapsed = durationMs - remainingMs
    return {
      mode,
      running,
      remainingMs,
      durationMs,
      completedFocusCount,
      progress: durationMs > 0 ? Math.min(1, elapsed / durationMs) : 0,
      justFinished,
      start,
      pause,
      toggle,
      reset,
      skip,
      setMode,
    }
  }, [
    mode,
    running,
    remainingMs,
    durationMs,
    completedFocusCount,
    justFinished,
    start,
    pause,
    toggle,
    reset,
    skip,
    setMode,
  ])

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  )
}

export function usePomodoro(): PomodoroContextValue {
  const ctx = React.useContext(PomodoroContext)
  if (!ctx) {
    throw new Error("usePomodoro must be used within a PomodoroProvider")
  }
  return ctx
}
