"use client"

import * as React from "react"
import {
  Coffee,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  SkipForward,
  Timer as TimerIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { usePomodoro, TIMER_LABELS } from "@/hooks/use-pomodoro"
import { useStudyStore } from "@/hooks/use-study-store"
import { formatClock, formatDuration, formatTime } from "@/lib/date-utils"
import type { TimerMode } from "@/lib/types"

const RING_RADIUS = 54
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function ProgressRing({
  progress,
  mode,
  children,
}: {
  progress: number
  mode: TimerMode
  children: React.ReactNode
}) {
  const color =
    mode === "focus"
      ? "var(--primary)"
      : mode === "short"
        ? "var(--color-amber-500, #f59e0b)"
        : "var(--color-teal-500, #14b8a6)"
  return (
    <div className="relative mx-auto size-56 sm:size-64" aria-hidden={false}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          stroke="var(--border)"
          strokeWidth="7"
        />
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
          className="transition-[stroke-dashoffset] duration-300 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}

function clampInt(value: string, min: number, max: number, fallback: number) {
  const n = Number.parseInt(value, 10)
  if (Number.isNaN(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function TimerSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data, updatePomodoroSettings } = useStudyStore()
  const s = data.settings.pomodoro
  const [draft, setDraft] = React.useState(s)

  React.useEffect(() => {
    if (open) setDraft(data.settings.pomodoro)
     
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Timer settings</DialogTitle>
          <DialogDescription>
            Customize your Pomodoro cycle. Changes apply to the next session.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="set-focus">Focus (min)</Label>
            <Input
              id="set-focus"
              type="number"
              min={1}
              max={120}
              value={draft.focusMin}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  focusMin: clampInt(e.target.value, 1, 120, d.focusMin),
                }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-short">Short break (min)</Label>
            <Input
              id="set-short"
              type="number"
              min={1}
              max={30}
              value={draft.shortBreakMin}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  shortBreakMin: clampInt(e.target.value, 1, 30, d.shortBreakMin),
                }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-long">Long break (min)</Label>
            <Input
              id="set-long"
              type="number"
              min={1}
              max={60}
              value={draft.longBreakMin}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  longBreakMin: clampInt(e.target.value, 1, 60, d.longBreakMin),
                }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-cycle">Long break every</Label>
            <Input
              id="set-cycle"
              type="number"
              min={2}
              max={8}
              value={draft.sessionsBeforeLongBreak}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  sessionsBeforeLongBreak: clampInt(
                    e.target.value,
                    2,
                    8,
                    d.sessionsBeforeLongBreak
                  ),
                }))
              }
            />
          </div>
        </div>
        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="set-auto" className="text-sm font-normal">
              Auto-start next session
            </Label>
            <Switch
              id="set-auto"
              checked={draft.autoStartNext}
              onCheckedChange={(v) => setDraft((d) => ({ ...d, autoStartNext: v }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="set-sound" className="text-sm font-normal">
              Sound when a session ends
            </Label>
            <Switch
              id="set-sound"
              checked={draft.soundEnabled}
              onCheckedChange={(v) => setDraft((d) => ({ ...d, soundEnabled: v }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              updatePomodoroSettings(draft)
              onOpenChange(false)
            }}
          >
            Save settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TimerView() {
  const {
    mode,
    running,
    remainingMs,
    progress,
    completedFocusCount,
    toggle,
    reset,
    skip,
    setMode,
  } = usePomodoro()
  const { data } = useStudyStore()
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const s = data.settings.pomodoro

  const todaySessions = React.useMemo(() => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    return data.focusSessions
      .filter((f) => f.endedAt >= startOfDay.getTime())
      .sort((a, b) => b.endedAt - a.endedAt)
  }, [data.focusSessions])

  const todayMs = todaySessions.reduce((a, f) => a + f.durationMs, 0)
  const allTimeSessions = data.focusSessions.length
  const allTimeMs = data.focusSessions.reduce((a, f) => a + f.durationMs, 0)

  const cyclePos =
    completedFocusCount % s.sessionsBeforeLongBreak === 0 && completedFocusCount > 0
      ? s.sessionsBeforeLongBreak
      : completedFocusCount % s.sessionsBeforeLongBreak

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Focus Timer
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pomodoro cycles with automatic breaks and a session log.
          </p>
        </div>
        <Button variant="outline" onClick={() => setSettingsOpen(true)}>
          <Settings2 className="mr-2 size-4" /> Settings
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Timer card */}
        <Card className="lg:col-span-3">
          <CardContent className="flex flex-col items-center gap-6 p-6 sm:p-8">
            <Tabs
              value={mode}
              onValueChange={(v) => setMode(v as TimerMode)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="focus">Focus</TabsTrigger>
                <TabsTrigger value="short">Short Break</TabsTrigger>
                <TabsTrigger value="long">Long Break</TabsTrigger>
              </TabsList>
            </Tabs>

            <ProgressRing progress={progress} mode={mode}>
              <span
                className={cn(
                  "text-xs font-medium uppercase tracking-widest",
                  mode === "focus" ? "text-primary" : "text-amber-600 dark:text-amber-400"
                )}
              >
                {TIMER_LABELS[mode]}
              </span>
              <span className="mt-1 text-5xl font-bold tabular-nums tracking-tight sm:text-6xl">
                {formatClock(remainingMs)}
              </span>
              <span className="mt-1 text-[11px] text-muted-foreground">
                {running
                  ? "In progress…"
                  : remainingMs < (mode === "focus" ? s.focusMin : mode === "short" ? s.shortBreakMin : s.longBreakMin) * 60_000
                    ? "Paused"
                    : "Ready"}
              </span>
            </ProgressRing>

            {/* Cycle dots */}
            <div className="flex items-center gap-1.5" aria-label={`Completed ${cyclePos} of ${s.sessionsBeforeLongBreak} focus sessions toward a long break`}>
              {Array.from({ length: s.sessionsBeforeLongBreak }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "size-2.5 rounded-full transition-colors",
                    i < cyclePos ? "bg-primary" : "bg-muted border border-border"
                  )}
                  aria-hidden
                />
              ))}
              <Coffee className="ml-1.5 size-3.5 text-muted-foreground" aria-hidden />
              <span className="text-[11px] text-muted-foreground">
                long break after {s.sessionsBeforeLongBreak}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <Button
                size="lg"
                className="h-12 w-36 text-base font-semibold"
                onClick={toggle}
              >
                {running ? (
                  <>
                    <Pause className="mr-2 size-5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 size-5" /> Start
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-12"
                onClick={reset}
                aria-label="Reset timer"
              >
                <RotateCcw className="size-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-12"
                onClick={skip}
                aria-label="Skip to next session"
              >
                <SkipForward className="size-5" />
              </Button>
            </div>

            <p className="text-center text-[11px] text-muted-foreground">
              {running
                ? "You can navigate away — the timer keeps running."
                : s.autoStartNext
                  ? "Breaks auto-start when a session ends."
                  : "Auto-start is off — start each session manually."}
            </p>
          </CardContent>
        </Card>

        {/* Session log */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TimerIcon className="size-4 text-primary" aria-hidden />
              Today&apos;s log
            </CardTitle>
            <CardDescription>
              {todaySessions.length > 0
                ? `${todaySessions.length} session${todaySessions.length === 1 ? "" : "s"} · ${formatDuration(todayMs)} focused`
                : "No focus sessions completed yet today"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            {todaySessions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
                <Coffee className="size-8 text-muted-foreground/50" aria-hidden />
                <p className="max-w-[220px] text-sm text-muted-foreground">
                  Finished focus sessions will appear here, tied to today&apos;s
                  date.
                </p>
              </div>
            ) : (
              <ul className="max-h-[380px] space-y-1.5 overflow-y-auto sf-scroll pr-1">
                {todaySessions.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "flex size-7 items-center justify-center rounded-md",
                          f.mode === "focus"
                            ? "bg-primary/10 text-primary"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        )}
                      >
                        {f.mode === "focus" ? (
                          <TimerIcon className="size-3.5" aria-hidden />
                        ) : (
                          <Coffee className="size-3.5" aria-hidden />
                        )}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {TIMER_LABELS[f.mode]}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatTime(f.startedAt)} – {formatTime(f.endedAt)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatDuration(f.durationMs)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {allTimeSessions > 0 && (
              <p className="mt-4 border-t pt-3 text-center text-xs text-muted-foreground">
                All-time: {allTimeSessions} session{allTimeSessions === 1 ? "" : "s"} ·{" "}
                {formatDuration(allTimeMs)} of deep work
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <TimerSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
