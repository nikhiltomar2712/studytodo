"use client"

import * as React from "react"
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Circle,
  Flame,
  GraduationCap,
  Layers,
  Plus,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import {
  computeStreak,
  deckStats,
  dueCards,
  masteryPercent,
  todayActivity,
  totalReviews,
  useStudyStore,
} from "@/hooks/use-study-store"
import type { DeckColor, FlashcardsIntent, View } from "@/lib/types"
import { DECK_DOT_CLASS } from "./deck-colors"
import {
  formatDuration,
  greeting,
  lastNDayKeys,
  weekdayLabel,
} from "@/lib/date-utils"
import { toast } from "sonner"

/* Sample deck used by the "Try a sample deck" onboarding action. */
const SAMPLE_DECK: {
  name: string
  description: string
  color: DeckColor
  cards: { front: string; back: string; tags: string[] }[]
} = {
  name: "Sample — Learning How to Learn",
  description: "A starter deck to explore spaced repetition.",
  color: "emerald",
  cards: [
    {
      front: "What is the **spacing effect**?",
      back: "The finding that information reviewed at *increasing intervals* is retained far longer than the same amount of study crammed together.",
      tags: ["memory"],
    },
    {
      front: "What does the `Again` rating do to a card?",
      back: "It lapses the card: ease drops, the interval resets, and the card returns to learning so you see it again within minutes.",
      tags: ["studyflow"],
    },
    {
      front: "Why is **active recall** stronger than re-reading?",
      back: "- Forces retrieval pathways to strengthen\n- Exposes gaps immediately\n- Produces durable long-term memory traces",
      tags: ["memory"],
    },
    {
      front: "Roughly how long until a `Good` rated card matures?",
      back: "With consistent reviews intervals grow ~2.5x each time: 1d → 3d → 8d → 20d → 50d. Around **21 days** of interval a card is considered mature.",
      tags: ["srs"],
    },
    {
      front: "What is the ideal focus block length in a Pomodoro cycle?",
      back: "Classic setting: `25 min` focus + `5 min` short break, with a `15 min` long break after every 4th session.",
      tags: ["focus"],
    },
  ],
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconClass,
  progress,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
  iconClass?: string
  progress?: number
}) {
  return (
    <Card className="p-4 gap-0">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary",
            iconClass
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums tracking-tight">
        {value}
      </div>
      {progress !== undefined && (
        <Progress value={progress} className="mt-2 h-1.5" aria-label={`${label} progress`} />
      )}
      {sub && <div className="mt-1.5 text-[11px] text-muted-foreground">{sub}</div>}
    </Card>
  )
}

function QuickAction({
  icon: Icon,
  title,
  desc,
  onClick,
  primary,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        primary
          ? "border-primary/30 bg-primary/[0.07] hover:border-primary/50"
          : "bg-card hover:border-primary/30"
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors",
          primary
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground"
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{desc}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
    </button>
  )
}

export function Dashboard({
  onNavigate,
  onFlashcardsIntent,
}: {
  onNavigate: (view: View) => void
  onFlashcardsIntent: (intent: FlashcardsIntent) => void
}) {
  const { data, addDeck, addCard, moveTask } = useStudyStore()
  const dueCount = React.useMemo(() => dueCards(data).length, [data])
  const dueByDeck = React.useMemo(() => {
    const map = new Map<string, number>()
    dueCards(data).forEach((c) => map.set(c.deckId, (map.get(c.deckId) ?? 0) + 1))
    return map
  }, [data])

  const reviewed = totalReviews(data)
  const streak = computeStreak(data.activity)
  const mastery = masteryPercent(data)
  const today = todayActivity(data)

  const weekKeys = React.useMemo(() => lastNDayKeys(7), [])
  const weekMax = React.useMemo(
    () => Math.max(4, ...weekKeys.map((k) => (data.activity[k]?.reviews ?? 0))),
    [weekKeys, data.activity]
  )

  const openTasks = React.useMemo(
    () =>
      data.tasks
        .filter((t) => t.status !== "done")
        .sort((a, b) => Number(b.starred) - Number(a.starred) || b.createdAt - a.createdAt)
        .slice(0, 5),
    [data.tasks]
  )
  const doneTodayCount = React.useMemo(
    () => data.tasks.filter((t) => t.status === "done").length,
    [data.tasks]
  )
  const focusToday = React.useMemo(() => {
    const sessions = data.focusSessions.filter(
      (s) => s.mode === "focus" && new Date(s.endedAt).toDateString() === new Date().toDateString()
    )
    return { count: sessions.length, ms: sessions.reduce((a, s) => a + s.durationMs, 0) }
  }, [data.focusSessions])

  const loadSample = () => {
    const deckId = addDeck(SAMPLE_DECK.name, SAMPLE_DECK.description, SAMPLE_DECK.color)
    SAMPLE_DECK.cards.forEach((c) => addCard(deckId, c.front, c.back, c.tags))
    toast.success("Sample deck added", {
      description: "Open Flashcards and hit Study all due to try it out.",
    })
  }

  const dateLabel = new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting()}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {dateLabel} · {dueCount > 0
              ? `${dueCount} card${dueCount === 1 ? "" : "s"} ready for review`
              : "You're all caught up on reviews"}
          </p>
        </div>
        <Badge
          variant={dueCount > 0 ? "default" : "secondary"}
          className="h-8 gap-1.5 rounded-full px-3 text-xs"
        >
          <Sparkles className="size-3.5" aria-hidden />
          {dueCount > 0 ? "Review time" : "All clear"}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={BrainCircuit}
          label="Cards reviewed"
          value={reviewed.toLocaleString()}
          sub={`${today.reviews} today`}
        />
        <StatCard
          icon={Flame}
          label="Current streak"
          value={`${streak} ${streak === 1 ? "day" : "days"}`}
          sub={streak > 0 ? "Keep it alive" : "Study today to start one"}
          iconClass="text-orange-600 bg-orange-500/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Mastery"
          value={`${mastery}%`}
          progress={mastery}
          sub="cards with 21d+ interval"
        />
        <StatCard
          icon={Timer}
          label="Focus today"
          value={formatDuration(focusToday.ms)}
          sub={`${focusToday.count} session${focusToday.count === 1 ? "" : "s"} completed`}
        />
      </div>

      {/* Quick actions */}
      <section aria-label="Quick actions">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction
            primary
            icon={GraduationCap}
            title="Start studying"
            desc={dueCount > 0 ? `${dueCount} due now` : "Review ahead anyway"}
            onClick={() => onFlashcardsIntent({ type: "review-due" })}
          />
          <QuickAction
            icon={Layers}
            title="Create flashcards"
            desc={data.decks.length ? "Add to a deck" : "Create your first deck"}
            onClick={() =>
              onFlashcardsIntent(
                data.decks.length ? { type: "decks" } : { type: "create-deck" }
              )
            }
          />
          <QuickAction
            icon={Timer}
            title="Focus timer"
            desc="Start a Pomodoro session"
            onClick={() => onNavigate("timer")}
          />
          <QuickAction
            icon={Plus}
            title="Plan your day"
            desc={`${openTasks.length} open · ${doneTodayCount} done`}
            onClick={() => onNavigate("tasks")}
          />
        </div>
      </section>

      {data.decks.length === 0 && data.cards.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-6" aria-hidden />
            </span>
            <div>
              <p className="font-semibold">New to StudyFlow?</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Create a deck in Flashcards, or load a small sample deck to see
                spaced repetition in action right away.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={loadSample}>Load sample deck</Button>
              <Button variant="outline" onClick={() => onFlashcardsIntent({ type: "create-deck" })}>
                <Plus className="mr-2 size-4" /> Create a deck
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lower grid */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Activity + decks */}
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="text-base">Last 7 days</CardTitle>
              <CardDescription>Cards reviewed per day</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 sm:p-6 sm:pt-2">
              <div className="flex h-28 items-end justify-between gap-2 sm:gap-3">
                {weekKeys.map((key) => {
                  const reviews = data.activity[key]?.reviews ?? 0
                  const pct = (reviews / weekMax) * 100
                  const isToday = key === lastNDayKeys(1)[0]
                  return (
                    <div key={key} className="flex flex-1 flex-col items-center gap-1.5">
                      <div className="flex h-24 w-full items-end justify-center">
                        <div
                          className={cn(
                            "w-full max-w-7 rounded-md transition-all",
                            reviews > 0
                              ? isToday
                                ? "bg-primary"
                                : "bg-primary/50"
                              : "bg-muted"
                          )}
                          style={{ height: `${Math.max(reviews > 0 ? 8 : 3, pct)}%` }}
                          title={`${reviews} review${reviews === 1 ? "" : "s"}${data.activity[key]?.focusMinutes ? ` · ${data.activity[key].focusMinutes} min focus` : ""}`}
                        />
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-medium",
                          isToday ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {weekdayLabel(new Date(`${key}T12:00:00`))}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {data.decks.length > 0 && (
            <Card>
              <CardHeader className="flex-row items-center justify-between p-4 pb-2 sm:p-6 sm:pb-2">
                <div>
                  <CardTitle className="text-base">Jump back in</CardTitle>
                  <CardDescription>Decks with due cards</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => onFlashcardsIntent({ type: "review-due" })}
                  disabled={dueCount === 0}
                >
                  Study all due
                </Button>
              </CardHeader>
              <CardContent className="max-h-72 space-y-2 overflow-y-auto p-4 pt-0 sf-scroll sm:p-6 sm:pt-0">
                {data.decks.map((deck) => {
                  const stats = deckStats(data, deck.id)
                  const deckDue = dueByDeck.get(deck.id) ?? 0
                  return (
                    <button
                      key={deck.id}
                      type="button"
                      onClick={() => onFlashcardsIntent({ type: "review-due", deckId: deck.id })}
                      className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/50"
                    >
                      <span
                        className={cn(
                          "size-2.5 shrink-0 rounded-full",
                          DECK_DOT_CLASS[deck.color] ?? "bg-primary"
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {deck.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {stats.total} cards · {stats.masteryPct}% mastered
                        </span>
                      </span>
                      {deckDue > 0 ? (
                        <Badge className="shrink-0 rounded-full">{deckDue} due</Badge>
                      ) : (
                        <Badge variant="secondary" className="shrink-0 rounded-full">
                          clear
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Today's goals */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between p-4 pb-2 sm:p-6 sm:pb-2">
            <div>
              <CardTitle className="text-base">Today&apos;s goals</CardTitle>
              <CardDescription>
                {doneTodayCount} done · {openTasks.length} open
              </CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onNavigate("tasks")}>
              <Plus className="size-4" /> Plan
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            {openTasks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 className="size-8 text-primary/60" aria-hidden />
                <p className="text-sm text-muted-foreground">
                  Nothing queued. Add study topics on the Tasks board.
                </p>
                <Button variant="outline" size="sm" onClick={() => onNavigate("tasks")}>
                  Open task board
                </Button>
              </div>
            ) : (
              <ul className="space-y-1">
                {openTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
                  >
                    <Checkbox
                      id={`dash-task-${task.id}`}
                      className="mt-0.5"
                      checked={false}
                      onCheckedChange={() =>
                        moveTask(task.id, "done")
                      }
                      aria-label={`Mark "${task.title}" done`}
                    />
                    <label
                      htmlFor={`dash-task-${task.id}`}
                      className="min-w-0 flex-1 cursor-pointer text-sm leading-snug"
                    >
                      <span className={cn("block truncate", task.starred && "font-medium")}>
                        {task.title}
                      </span>
                      {task.starred && (
                        <span className="text-[11px] text-orange-500">Today&apos;s goal</span>
                      )}
                    </label>
                    <span
                      className={cn(
                        "mt-1 size-1.5 shrink-0 rounded-full",
                        task.priority === "high"
                          ? "bg-rose-500"
                          : task.priority === "medium"
                            ? "bg-amber-500"
                            : "bg-muted-foreground/40"
                      )}
                      title={`${task.priority} priority`}
                      aria-hidden
                    />
                  </li>
                ))}
              </ul>
            )}
            {openTasks.length > 0 && (
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Circle className="size-3" aria-hidden />
                Tap a circle to complete a goal
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
